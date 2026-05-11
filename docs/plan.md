# AWS Docs Companion — 実装計画

このドキュメントは「どう作るか・どの順で進めるか」を扱う。「何を作るか」は `spec.md` を参照。

最終更新: 2026-05-11

---

## 1. アーキテクチャ全体像

Chrome 拡張機能(Manifest V3)の標準 3 コンポーネント構成で組み立てる。3 つのスクリプトはそれぞれ独立した JavaScript 実行コンテキストを持っており、`chrome.runtime` のメッセージング API で会話する。

```
┌─────────────────────┐   chrome.tabs.onActivated   ┌─────────────────────┐
│  Service Worker     │ ──────────────────────────▶ │  対象URL判定        │
│  (background)       │                              │  → sidePanel.setOptions │
│                     │ ◀────── 要約結果保存 ─────── │                     │
└──────────┬──────────┘                              └─────────────────────┘
           │ chrome.scripting.executeScript
           ▼
┌─────────────────────┐    chrome.runtime.sendMessage    ┌─────────────────────┐
│  Content Script     │ ───────────────────────────────▶ │  Side Panel UI      │
│  (extract.ts)       │   { type: "ARTICLE", text }      │  - 「要約する」ボタン│
│  Readability で抽出 │                                   │  - LLM 呼び出し     │
└─────────────────────┘                                   │  - ストリーミング表示│
                                                          └─────────────────────┘
```

**LLM 呼び出しはサイドパネル文脈(window)で実行する**。`LanguageModel` API は Service Worker 内では確実に動作しないことが報告されているため、UI 側で `LanguageModel.create()` を呼ぶ設計にする(参考: Chrome Extension Samples の Prompt API 事例)。

### コンポーネント別の責務

| コンポーネント | ファイル | 責務 |
|---|---|---|
| Service Worker | `src/background/service-worker.ts` | タブ切り替え検知、URL 判定、サイドパネル ON/OFF、Content Script 注入 |
| Content Script | `src/content/extract.ts` | `@mozilla/readability` で本文抽出、SW へ送信 |
| Side Panel UI | `src/sidepanel/*.ts` | ボタンとレイアウト、Prompt API 呼び出し、ストリーミング描画 |
| 共通ライブラリ | `src/lib/*.ts` | URL マッチャ、Prompt API ラッパ、ロガー、エラー型 |
| プロンプト | `src/prompts/summarize-aws-docs.ts` | システム/ユーザープロンプトのテンプレ |

---

## 2. 技術選定の根拠

てつてつの学習のため、各採用技術について「なぜそれを選ぶか」を明示しておく。

### 2.1 ビルドツール: Vite + `@crxjs/vite-plugin`
- **採用理由**: Manifest V3 拡張の HMR(ホットリロード)、`manifest.json` パース、複数エントリポイント(SW/Content/SidePanel)のバンドルを自動でやってくれる。Chrome Extension Samples でも採用例多数。
- **代替案**: webpack 直書き → 設定ファイルが膨れる / Parcel → MV3 のお作法は手動。
- **トレードオフ**: CRXjs はまだ 2.x の beta 系統。バージョン固定で運用する。

### 2.2 本文抽出: `@mozilla/readability`
- **採用理由**: Firefox Reader View 本家。AWS Docs のような構造化記事(`<article>`,`<main>`)に強く、ノイズ(ナビ・サイドバー)除去が安定。
- **代替案**: 独自スクレイピング → AWS Docs のクラス名変更で壊れる / Defuddle → 新しすぎる。
- **トレードオフ**: SPA で動的に挿入される本文には弱い → spec 8.2 のフォールバック必要。

### 2.3 LLM: Built-in Prompt API (Gemini Nano)
- **採用理由**: 要件で「外部送信なし」「完全ローカル」が必須(spec 3.2)。Chrome 138+ で標準利用可能。$0。
- **代替案**: Bedrock(Claude/Nova) → 課金 + 認証必要 + 個人情報を含む可能性のあるページ本文がクラウドに出る / OpenAI API → 同上。
- **トレードオフ**: 小さい(Nano)モデルなので精度は Claude/GPT に劣る、HW 要件あり、Origin Trial 状態のためいつ仕様が変わるか不透明。

### 2.4 UI フレームワーク: なし(Vanilla TS)
- **採用理由**: サイドパネルは UI 要素 5〜6 個程度。React/Vue の依存(数百 KB)を入れる価値が薄い。
- **代替案**: React → 開発体験 ◯ だがバンドル肥大 / Lit → 中間案だが学習コスト。
- **トレードオフ**: ステート管理は手書きになる。今回は単一画面なので問題ない。

### 2.5 テスト: Vitest
- **採用理由**: Vite と同じトランスフォーマで設定が薄い。Chrome 拡張のロジック部(URL マッチャ、Prompt ラッパ)を Node 環境でテストするのに十分。
- **代替案**: Jest → 設定が重い / Playwright → Load Unpacked 運用なので E2E は手動受け入れテストで代替。
- **トレードオフ**: Chrome API のモック(`chrome.runtime` 等)は自前で書く必要がある。

---

## 3. 開発マイルストーン

各 M ごとに PR を起こす(レビュー単位として適切な粒度)。`chore` 系は main 直接コミット OK。

| M | 内容 | 種別 | ブランチ |
|---|---|---|---|
| M0 | プロジェクト初期化(docs/, README, .gitignore, リポジトリ作成) | chore | main 直接 |
| M1 | ビルド基盤(package.json, tsconfig, vite.config, eslint, prettier, manifest 雛形) | chore | main 直接 |
| M2 | URL 判定 & サイドパネル開閉(service worker + url-matcher) | feat | feature/sidepanel-toggle |
| M3 | 本文抽出(content script + Readability + メッセージング) | feat | feature/article-extract |
| M4 | Prompt API ラッパ(availability チェック / セッション / ストリーミング) | feat | feature/prompt-api-wrapper |
| M5 | サイドパネル UI(ボタン/プログレス/結果表示/コピー/再要約) | feat | feature/sidepanel-ui |
| M6 | エラーハンドリング(spec 2.6 の全パターン) | feat | feature/error-handling |
| M7 | テスト整備(Vitest, カバレッジ 80%+) | test | main 直接 |
| M8 | 受け入れ条件チェック(spec 9 章)・最終調整 | refactor or fix | feature/acceptance-check |

---

## 4. 想定されるリスクと回避策

| リスク | 対応 |
|---|---|
| Built-in Prompt API の availability が環境依存で `unavailable` だと開発が止まる | M2 着手前にてつてつに `docs/knowledge.md` の事前確認を依頼する |
| Service Worker のライフサイクル(Idle で eviction) | 永続させたい状態は `chrome.storage.session` に逃がす。SW を「ステートを持たないルータ」として組む |
| Readability が SPA で空を返す | spec 8.2 通り main → article → body の順でフォールバック |
| `@crxjs/vite-plugin` の HMR と Side Panel の組み合わせ実例が少ない | 公式 examples を `docs/knowledge.md` に集めて運用知見として残す |
| Prompt API の型定義が未公式 | `src/types/prompt-api.d.ts` を自前で書く。型は spec 7.1〜7.4 から起こす |
| Chrome 138+ で API シグネチャが変わる可能性 | バージョン固定 / ラッパで隔離(spec 4 章で挙げたとおり `src/lib/prompt-api.ts` に閉じる) |

---

## 5. 開発フロー(運用)

CLAUDE.md のルールに従う:

- `chore` / `docs` / `test` は **main 直接コミット** OK
- `feat` / `fix` / `refactor` は **feature ブランチ + PR 経由**
- ブランチ切り替えは `git switch`
- コミットしたら都度 push まで1セット
- 機能の論理的な区切りごとにコミット(まとめてコミットは禁止)

---

## 6. 直近の次のアクション

1. このプランをてつてつにレビューしてもらい、合意する
2. 並行して、てつてつは `docs/knowledge.md` の事前確認チェックリスト(Chrome 138+ / Gemini Nano / Node 22)を実機で確認
3. 合意 + 確認完了後、**M1: ビルド基盤** に着手(理解度テストハーネスを通してから)

---

## 7. 改訂履歴

| 日付 | 内容 |
|---|---|
| 2026-05-11 | 初版作成 |
