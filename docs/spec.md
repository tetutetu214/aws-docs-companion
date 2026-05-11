# AWS Docs Companion — 要件定義書

> Chrome内蔵LLM(Gemini Nano)を使ったAWS公式ドキュメント要約Chrome拡張機能
> 自分専用利用、Chrome Web Store公開なし、Load Unpackedで運用

---

## 1. プロジェクト概要

### 1.1 目的
AWS公式ドキュメント・公式ブログを開いたとき、Chromeのサイドパネルに「要約する」ボタンを表示し、クリックで現在表示中のページを中学生にも理解できるトーンで要約する。

### 1.2 利用形態
- 開発者本人(tetutetu)の個人Chromeに Load Unpacked で導入
- Chrome Web Storeへの公開は行わない($5の登録料不要)
- ソースコードは個人GitHubで管理(public/privateは未定)

### 1.3 想定ユーザー
- 開発者本人のみ
- 環境: Windows 10/11 + WSL2(開発)、Windows側Chromeで実行

---

## 2. 機能要件

### 2.1 トリガー
- 対象URLでサイドパネルアイコンを有効化(`chrome.sidePanel.setOptions`)
- サイドパネルUIの「要約する」ボタンを**ユーザーが手動クリック**して要約開始
- ページ表示時の自動実行は**行わない**

### 2.2 対象URL(host_permissions / matches)
以下のすべてのURLパターンを対象とする:

| パターン | 用途 |
|---|---|
| `https://docs.aws.amazon.com/*` | AWS公式ドキュメント全般(ユーザーガイド、デベロッパーガイド、API Reference等) |
| `https://aws.amazon.com/blogs/*` | AWS公式英語ブログ |
| `https://aws.amazon.com/jp/blogs/*` | AWS公式日本語ブログ |
| `https://aws.amazon.com/builders-library/*` | Amazon Builders' Library |
| `https://aws.amazon.com/architecture/*` | AWS Architecture Center |

対象外URLではサイドパネルアイコンを無効化(クリックしても要約ボタン押下時に「対象外ページです」を表示)。

### 2.3 要約処理
1. content scriptで現在ページの本文を抽出
2. 抽出テキストをBuilt-in Prompt API(`LanguageModel.prompt`)に投入
3. ストリーミングでサイドパネルに逐次表示

### 2.4 出力フォーマット
LLMには以下の構造化出力を指示する:

```
【1段落の要点】
(80〜150字程度で、このページが何を説明しているか中学生にもわかる言葉で1段落)

【3つのポイント】
1. (40〜80字、最も重要なポイント)
2. (40〜80字、2番目に重要なポイント)
3. (40〜80字、3番目に重要なポイント)
```

- 中学生レベル: 専門用語が登場したら必ずカッコ書きで一言補足を入れる
- 全文日本語出力(原文が英語でも日本語に翻訳して要約)

### 2.5 サイドパネルUI
- ヘッダー: 拡張機能名、現在のページタイトル
- 「要約する」ボタン(中央配置、押下中は無効化 + スピナー)
- 要約表示エリア(ストリーミング対応、Markdown風レンダリング)
- フッター: Gemini Nanoモデルバージョン、最終要約日時
- 「コピー」ボタン: 要約結果をクリップボードへ
- 「再要約」ボタン: 同一ページで再実行

### 2.6 エラーハンドリング(ユーザー向けメッセージは日本語)
| エラー条件 | 表示メッセージ | 対応 |
|---|---|---|
| Built-in AI API未対応Chrome | 「Chrome 138以上が必要です。現在のバージョン: XXX」 | ボタン無効化 |
| `LanguageModel.availability() === 'unavailable'` | 「お使いの環境ではGemini Nanoが利用できません。GPU/RAM/ストレージ要件をご確認ください」 | ボタン無効化、要件説明リンク |
| `availability === 'downloadable'` または `'downloading'` | 「モデルをダウンロード中…(進捗 XX%)」 | プログレスバー表示、完了後に要約可能化 |
| 対象外URL | 「このページは対象外です。AWS公式ドキュメント/ブログを開いてください」 | ボタン非表示 |
| 本文抽出失敗(空文字、500字未満) | 「本文が抽出できませんでした。ページが完全に読み込まれているかご確認ください」 | 再試行ボタン |
| Prompt API実行時例外 | 「要約に失敗しました: (例外メッセージ)」 | リトライボタン、devtools出力 |
| トークン上限超過 | 「ページが長すぎるため先頭部分のみ要約しました」 | 警告アイコン + 要約は実行 |

---

## 3. 非機能要件

### 3.1 品質
- TypeScript 5.x で実装(`strict: true`)
- ESLint + Prettier
- ユニットテスト: Vitest
- 主要コンポーネントのカバレッジ80%以上
- E2Eテストは対象外(Load Unpacked運用のため手動受け入れテストで代替)

### 3.2 セキュリティ
- LLM呼び出しは完全ローカル(Gemini Nano)→ 外部API通信なし
- ページ本文を外部に送信しない(プライバシー確保)
- Content Security Policy: `script-src 'self'; object-src 'self'`
- `host_permissions` は2.2の最小範囲のみ
- `<all_urls>` は使用しない

### 3.3 パフォーマンス
- サイドパネル起動 → 「要約する」ボタン表示まで 1秒以内
- ボタンクリック → 最初のトークン出力まで 5秒以内(初回モデルロード除く)
- ページ本文抽出は10MBまで対応(超過時は先頭部分のみ)

### 3.4 拡張性
- プロンプトテンプレートは `src/prompts/` に分離し、対象サイトごとに切り替え可能な構造にしておく
- 将来「英語サイトの場合は翻訳セクションも追加」のような拡張に備える

### 3.5 保守性
- Manifest V3 準拠
- service worker は `chrome.storage` で状態管理(SW終了対策)
- ログ出力は `console.log` ではなく独自logger経由(本番時OFF)

---

## 4. 技術スタック

| 項目 | 採用技術 | 一次ソース |
|---|---|---|
| 言語 | TypeScript 5.x | https://www.typescriptlang.org/ |
| ビルド | Vite + `@crxjs/vite-plugin` | https://crxjs.dev/vite-plugin/ |
| Manifest | V3 | https://developer.chrome.com/docs/extensions/reference/manifest |
| Side Panel | `chrome.sidePanel` API | https://developer.chrome.com/docs/extensions/reference/api/sidePanel |
| LLM | Built-in Prompt API (`LanguageModel`) | https://developer.chrome.com/docs/ai/prompt-api |
| 本文抽出 | `@mozilla/readability` | https://github.com/mozilla/readability |
| テスト | Vitest | https://vitest.dev/ |
| Lint | ESLint + Prettier | https://eslint.org/ , https://prettier.io/ |
| Node | 22 LTS | https://nodejs.org/ |

---

## 5. プロジェクト構成

```
aws-docs-companion/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── manifest.json
├── README.md
├── src/
│   ├── background/
│   │   └── service-worker.ts        # サイドパネル制御、URL判定
│   ├── content/
│   │   └── extract.ts               # Readabilityで本文抽出
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── main.ts                  # エントリポイント
│   │   ├── ui.ts                    # DOM操作
│   │   └── style.css
│   ├── lib/
│   │   ├── prompt-api.ts            # LanguageModel ラッパー
│   │   ├── url-matcher.ts           # 対象URL判定ロジック
│   │   ├── logger.ts
│   │   └── errors.ts                # カスタムエラー型
│   ├── prompts/
│   │   └── summarize-aws-docs.ts    # プロンプトテンプレート
│   └── types/
│       └── prompt-api.d.ts          # Built-in AI APIの型定義(未公式)
├── tests/
│   ├── url-matcher.test.ts
│   ├── prompt-api.test.ts
│   └── extract.test.ts
└── public/
    └── icons/                        # 16/48/128px
```

---

## 6. manifest.json 設計

```json
{
  "manifest_version": 3,
  "name": "AWS Docs Companion",
  "version": "0.1.0",
  "description": "AWS公式ドキュメントを中学生レベルに要約",
  "minimum_chrome_version": "138",
  "permissions": [
    "sidePanel",
    "storage",
    "scripting",
    "activeTab",
    "tabs"
  ],
  "host_permissions": [
    "https://docs.aws.amazon.com/*",
    "https://aws.amazon.com/blogs/*",
    "https://aws.amazon.com/jp/blogs/*",
    "https://aws.amazon.com/builders-library/*",
    "https://aws.amazon.com/architecture/*"
  ],
  "background": {
    "service_worker": "src/background/service-worker.ts",
    "type": "module"
  },
  "action": {
    "default_title": "AWS Docs Companion"
  },
  "side_panel": {
    "default_path": "src/sidepanel/index.html"
  },
  "icons": {
    "16": "public/icons/icon-16.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png"
  }
}
```

---

## 7. Prompt API 利用方針

### 7.1 利用可能性チェック
```ts
const availability = await LanguageModel.availability();
// 'available' | 'downloadable' | 'downloading' | 'unavailable'
```

### 7.2 セッション作成
- `systemPrompt`: 「あなたはAWS技術ドキュメントの専門家で、中学生にもわかるように説明します」
- `temperature`: 0.3(要約タスクなので低め)
- `topK`: 3
- 1ページ1セッション(使い回しはしない)

### 7.3 ストリーミング
```ts
const stream = session.promptStreaming(userPrompt);
for await (const chunk of stream) {
  // UIに逐次反映
}
```

### 7.4 トークン管理
- `session.inputUsage` / `session.inputQuota` を監視
- 本文を入れる前に超過しそうな場合は先頭から切り詰める

---

## 8. 本文抽出方針

### 8.1 抽出ロジック
1. content scriptで `document.cloneNode(true)` を取得
2. `@mozilla/readability` の `Readability` クラスでパース
3. `article.textContent` を取り出して空白正規化
4. service workerへ `chrome.runtime.sendMessage` で送信

### 8.2 抽出失敗時のフォールバック
- Readabilityがnullを返した場合は `<main>` または `<article>` 要素のtextContentを使用
- それも空なら `document.body.innerText` の先頭5000字

### 8.3 サイズ制限
- 抽出後テキストが500字未満 → エラー扱い
- 50,000字超 → 先頭50,000字に切り詰め、警告フラグを立てる

---

## 9. 受け入れ条件(Acceptance Criteria)

開発完了の判定基準:

- [ ] Load Unpackedでインストールできる
- [ ] `docs.aws.amazon.com/lambda/latest/dg/welcome.html` を開き、サイドパネルから要約が実行できる
- [ ] `aws.amazon.com/jp/blogs/news/` の任意記事で要約が実行できる
- [ ] `aws.amazon.com/builders-library/` の任意記事で要約が実行できる
- [ ] 出力が「1段落要点 + 3つのポイント」形式になっている
- [ ] 専門用語にカッコ書きの補足が付いている
- [ ] 対象外URL(例: `google.com`)を開いたときに「対象外」メッセージが出る
- [ ] Chrome 137以下では「Chrome 138以上が必要」エラーが出る
- [ ] Gemini Nano未ダウンロード状態でも適切なメッセージが出る
- [ ] ストリーミングで逐次表示される
- [ ] コピーボタンで要約がクリップボードに入る
- [ ] 全ユニットテストがパスする
- [ ] ESLintエラーゼロ
- [ ] TypeScriptコンパイルエラーゼロ

---

## 10. スコープ外(将来検討)

以下は今回のスコープに**含めない**:

- Chrome Web Storeへの公開
- 英語以外(中国語等)のAWS Docsローカライズページ対応
- 要約履歴の永続化(IndexedDB)
- 複数ページ横断要約
- クラウドLLMフォールバック(Bedrock等)
- Firefox/Safari対応
- スクリーンショット要約(マルチモーダル)
- ユーザー設定画面(プロンプト編集、出力スタイル変更)
- 翻訳機能(Translator API利用)
- 用語集機能(同義語辞書)

---

## 11. 開発前の確認事項

Claude Codeに渡す前に、開発者本人が以下を確認すること:

1. **Chromeバージョン**: `chrome://version` で 138以上であること
2. **Gemini Nano状態**: `chrome://on-device-internals` でモデルダウンロード完了状態であること
3. **ハード要件**: VRAM 4GB以上、空きストレージ22GB以上、RAM 16GB以上
4. **Prompt API動作確認**: 開発者ツールConsoleで `await LanguageModel.availability()` が `'available'` を返すこと
5. **Node.js**: `node -v` で v22.x がインストール済み

---

## 12. 参考リンク(一次ソース)

| 項目 | URL |
|---|---|
| Chrome Extensions ドキュメント | https://developer.chrome.com/docs/extensions/ |
| Manifest V3 | https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3 |
| Side Panel API | https://developer.chrome.com/docs/extensions/reference/api/sidePanel |
| Built-in AI 概要 | https://developer.chrome.com/docs/ai/built-in |
| Prompt API | https://developer.chrome.com/docs/ai/prompt-api |
| Built-in AI 開始ガイド | https://developer.chrome.com/docs/ai/get-started |
| Built-in AI APIs ステータス | https://developer.chrome.com/docs/ai/built-in-apis |
| Chrome Extensions Samples | https://github.com/GoogleChrome/chrome-extensions-samples |
| @mozilla/readability | https://github.com/mozilla/readability |
| @crxjs/vite-plugin | https://crxjs.dev/vite-plugin/ |

---

## 改訂履歴

| バージョン | 日付 | 内容 |
|---|---|---|
| 0.1.0 | 2026-05-11 | 初版作成 |
