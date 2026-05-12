# AWS Docs Companion — タスク管理

最終更新: 2026-05-11

---

## 進行中

- [x] Node 22 LTS 環境構築(nvm で v22.22.2、2026-05-12)
- [x] 理解度テストハーネス 3 問: 全問正解(Manifest V3 SW / Built-in Prompt API / 最小権限、2026-05-12)
- [x] 環境確認(2026-05-12): Chrome 147.0.7727.139(138+ クリア) / `LanguageModel` API 有効 / `availability()` = `"available"` / 出力言語指定が必要な API 変更を発見しknowledge.mdに記録
- [ ] **M1: ビルド基盤** 着手中

---

## バックログ(マイルストーンごと)

### M0: プロジェクト初期化(chore)
- [x] `docs/` ディレクトリ作成
- [x] `docs/spec.md`(要件定義書をそのまま保存)
- [x] `docs/plan.md`(本ドキュメントは plan.md とセット)
- [x] `docs/todo.md`(これ)
- [x] `docs/knowledge.md`(事前確認手順 + 学習済み概念の保管庫)
- [x] プロジェクト個別 `CLAUDE.md`
- [x] `README.md`(最小限)
- [x] `.gitignore`
- [x] `git init` + 初回コミット
- [x] GitHub public リポジトリ作成 + push(https://github.com/tetutetu214/aws-docs-companion)
- [x] Secret Scanning + Push Protection 有効化

### M1: ビルド基盤(chore)
- [x] `package.json`(vite 8 / @crxjs 2.4 / TS 5.9 / Vitest 4.1 / ESLint 9.39 / Prettier 3.8 / Readability 0.6)
- [x] `tsconfig.json`(strict + 追加チェック群)
- [x] `vite.config.ts`(CRXjs + Vitest 統合)
- [x] `manifest.json`(spec 6 章準拠、icons は M8 で追加)
- [x] `eslint.config.js`(spec の `.eslintrc.cjs` から flat config に変更)+ `.prettierrc.json` + `.prettierignore`
- [x] `src/types/prompt-api.d.ts`(Built-in AI API 型定義の雛形)
- [x] スタブ: `src/background/service-worker.ts` / `src/sidepanel/index.html` / `src/sidepanel/main.ts`
- [x] `npm run build` が通って `dist/` ができることを確認(116ms、5 ファイル生成)
- [x] `npm run typecheck` / `npm run lint` / `npm run format:check` 全部グリーン
- [ ] てつてつ: `dist/` を Load Unpacked で読み込めることを確認(Chrome 138+ 環境で)

### M2: URL 判定 & サイドパネル開閉(feat)
- [ ] `src/lib/url-matcher.ts`(spec 2.2 の 5 パターン判定)
- [ ] `src/lib/url-matcher.test.ts`
- [ ] `src/background/service-worker.ts`
  - [ ] `chrome.tabs.onActivated` / `onUpdated` で URL 判定 → `sidePanel.setOptions({ enabled })`
  - [ ] `chrome.action.onClicked` → `sidePanel.open()`
- [ ] 手動確認: AWS Docs を開くとサイドパネルが有効化される

### M3: 本文抽出(feat)
- [ ] `src/content/extract.ts`(Readability + フォールバック)
- [ ] サービスワーカー側で `chrome.scripting.executeScript` で content 注入 → 結果受信
- [ ] `src/content/extract.test.ts`(DOM fixture でテスト)

### M4: Prompt API ラッパ(feat)
- [ ] `src/types/prompt-api.d.ts` 完成
- [ ] `src/lib/prompt-api.ts`
  - [ ] `availability()` チェック
  - [ ] `LanguageModel.create()`
  - [ ] `promptStreaming()` ラッパ(AsyncIterable を返す)
  - [ ] inputUsage 監視 + 切り詰めロジック
- [ ] `src/prompts/summarize-aws-docs.ts`(spec 2.4 のフォーマット指示)
- [ ] `src/lib/prompt-api.test.ts`(モックで)

### M5: サイドパネル UI(feat)
- [ ] `src/sidepanel/index.html`
- [ ] `src/sidepanel/main.ts`(エントリ)
- [ ] `src/sidepanel/ui.ts`(DOM 操作)
- [ ] `src/sidepanel/style.css`
- [ ] 「要約する」ボタン → 抽出依頼 → LLM 実行 → ストリーミング描画
- [ ] コピーボタン(`navigator.clipboard.writeText`)
- [ ] 再要約ボタン

### M6: エラーハンドリング(feat)
- [ ] `src/lib/errors.ts`(カスタム例外型)
- [ ] spec 2.6 の 7 種類のエラーを全部 UI に出す
- [ ] `src/lib/logger.ts`(本番時 OFF)

### M7: テスト(test)
- [ ] カバレッジ 80% 以上
- [ ] `npm run lint` エラーゼロ
- [ ] `npm run typecheck` エラーゼロ

### M8: 受け入れ条件チェック(feat or fix)
- [ ] spec 9 章のチェックリストを実機で全部チェック
- [ ] README にスクショ・使い方追記

---

## 学習済み概念

理解度テストで全問正解した概念をここに蓄積する(次回スキップ判定に使う)。

(まだなし)

---

## 完了済み

(M0 のチェックボックス参照)
