# AWS Docs Companion — プロジェクト個別ルール

このファイルは個人グローバル設定(`~/.claude/CLAUDE.md`)に対する**追補**。
矛盾がある場合は本ファイルの記述が優先される。

---

## プロジェクト概要

Chrome 拡張機能。Chrome 内蔵 LLM(Gemini Nano / Built-in Prompt API)を使い、AWS 公式ドキュメントとブログを中学生レベルで要約してサイドパネルに表示する。Load Unpacked 専用、Chrome Web Store 公開予定なし。

詳細は `docs/spec.md` および `docs/plan.md` を参照。

---

## 技術スタック

| 項目 | 採用 |
|---|---|
| 言語 | TypeScript 5.x(`strict: true`) |
| ランタイム | Node.js 22 LTS(ビルド時のみ) |
| ビルド | Vite + `@crxjs/vite-plugin` |
| UI フレームワーク | なし(Vanilla TS) |
| Chrome API | Manifest V3, sidePanel, scripting, storage, tabs, activeTab |
| LLM | Built-in Prompt API(`LanguageModel`) |
| 本文抽出 | `@mozilla/readability` |
| テスト | Vitest |
| Lint / Format | ESLint + Prettier |

---

## インフラ構成

なし。完全ローカル動作。外部 API 呼び出しなし(LLM 含めすべてオンデバイス)。

---

## 重要な制約

- LLM 呼び出しは完全ローカル。**ページ本文を外部に送信しないこと**(spec 3.2)
- `host_permissions` は spec 2.2 の 5 パターンのみ。`<all_urls>` 禁止
- Manifest V3 service worker は eviction 前提。永続状態は `chrome.storage` に逃がす
- Chrome 138 以上が必須(`manifest.json` の `minimum_chrome_version: "138"`)
- `LanguageModel` API はサイドパネル(window)文脈で呼ぶ。Service Worker からは呼ばない

---

## ビルド・実行手順

```bash
# 依存インストール(M1 以降)
npm install

# 開発モード(Vite watch + 拡張ホットリロード)
npm run dev

# 本番ビルド → dist/ 配下に成果物
npm run build
```

### Chrome への読み込み(Load Unpacked)
1. Windows 側 Chrome で `chrome://extensions` を開く
2. 右上の「デベロッパーモード」を ON
3. 「パッケージ化されていない拡張機能を読み込む」
4. WSL 内の `dist/` をエクスプローラから指定
   (WSL パスは `\\wsl$\Ubuntu\home\tetutetu\projects\aws-docs-companion\dist`)

---

## テスト

```bash
# ユニットテスト
npm run test

# カバレッジ(主要モジュール 80%+ を維持)
npm run test:coverage
```

E2E は対象外。spec 9 章の受け入れ条件を**手動受け入れテスト**でカバーする。

---

## デプロイ

なし。本人 Chrome に Load Unpacked のみ。Chrome Web Store には出さない。

---

## このプロジェクトでの追加ルール

- **環境確認は先にやる**: 実装着手前に `docs/knowledge.md` の「開発前の環境確認チェックリスト」を必ず通す
- **Prompt API の型定義は自前**: 公式型定義がないため `src/types/prompt-api.d.ts` で補う。バージョン更新で API シグネチャが変わったらまずここを直す
- **プロンプトは `src/prompts/` に分離**: ハードコードしない。将来サイトごとに切り替え可能にする(spec 3.4)
- **`console.log` 禁止**: `src/lib/logger.ts` 経由のみ。本番時 OFF
