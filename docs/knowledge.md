# AWS Docs Companion — 開発知見・記録

開発中に得た知見、ハマったポイント、決定事項を蓄積する。

最終更新: 2026-05-11

---

## 1. 開発前の環境確認チェックリスト

実装着手前に**てつてつ本人**が以下を確認すること。spec 11 章に対応。

### 1.1 Chrome バージョン(要 138 以上)
1. Windows 側 Chrome の URL バーに `chrome://version` を入力
2. 1 行目「Google Chrome」が `138.0.x.x` 以上であることを確認
3. 未満なら Chrome 設定 → Chrome について から最新版に更新

### 1.2 Gemini Nano モデルダウンロード状態
1. Chrome の URL バーに `chrome://on-device-internals` を入力
2. 「Model status」が `Ready` になっているか確認
3. 未ダウンロードなら、適当な HTTPS ページで DevTools Console を開き次を実行:
   ```js
   await LanguageModel.create({});
   ```
   初回はモデルダウンロードがバックグラウンドで始まる(数 GB)
4. `chrome://components/` を開き、「Optimization Guide On Device Model」のバージョンが `0.0.0.0` でないことを確認

### 1.3 ハード要件
- 空き VRAM: 4 GB 以上(タスクマネージャ → パフォーマンス → GPU)
- 空きストレージ: 22 GB 以上(C: ドライブ空き容量)
- RAM: 16 GB 以上

### 1.4 Prompt API 動作確認
1. 任意の HTTPS ページで DevTools を開く
2. Console に以下を入力:
   ```js
   await LanguageModel.availability();
   ```
3. 戻り値:
   - `"available"` → そのまま開発に進める
   - `"downloadable"` / `"downloading"` → モデル DL を待つ。UI 側で進捗表示を実装するので開発自体は進められる
   - `"unavailable"` → ハード要件未達 or Chrome バージョン未達 / 開発不可

### 1.5 Node.js 22 LTS
**ステータス: 完了(2026-05-12)** nvm 経由で v22.22.2(lts/jod)導入済み。

確認コマンド:
```bash
node -v   # v22.22.2 が出ればOK
```

プロジェクトルートに `.nvmrc` を置いてあるので、新しいシェルで本ディレクトリに `cd` したあと `nvm use` を打てば自動で Node 22 に切り替わる。

---

## 2. 学習済み概念

理解度テストハーネスで全問正解した技術概念をここに蓄積する(次回以降テストスキップ判定に使う)。

| 概念 | 確認日 | メモ |
|---|---|---|
| Manifest V3 Service Worker のステートレス設計 | 2026-05-12 | SW はイベントで起動 → 走り終わると Chrome により eviction される「ルータ」として振る舞う。永続状態は `chrome.storage` に逃がさないとグローバル変数は消える |
| Built-in Prompt API(ローカル LLM)採用の本筋 | 2026-05-12 | 「無料」は副次的メリット。一番の決め手は spec 3.2 の「ページ本文を外部送信しない」プライバシー要件で、クラウド LLM(Bedrock/OpenAI)は最初から候補外 |
| host_permissions の最小権限原則 | 2026-05-12 | `<all_urls>` は MV3 でも使えるが、5 URL に絞ることで「万一バグでページを誤って掴んでも関係ないサイトの情報が漏れるリスクが最初から陰性」になる |

---

## 3. ハマったポイント・試行錯誤

実装中に得た知見をここに追記していく。同じ失敗を繰り返さないために。

### 2026-05-12: nvm install 後の `nvm use` が `~/.npmrc` で失敗
**症状**: `nvm install --lts=jod` でダウンロード自体は成功するが、`nvm use` が
`Your user's .npmrc file (${HOME}/.npmrc) has a 'globalconfig' and/or a 'prefix' setting, which are incompatible with nvm.`
を出して shell の Node を切り替えられない。

**原因**: `~/.npmrc` に `prefix=~/.npm-global` が書かれていた。これは sudo なしで `npm install -g` するための一般的なテクニックだが、nvm はバージョンごとに `~/.nvm/versions/node/vX.Y.Z/lib/node_modules` を使うので競合する。

**対処**: `~/.npmrc` を `~/.npmrc.bak` にリネーム。既存の `~/.npm-global/bin` に入っている `cdk` / `wrangler` は `~/.bashrc` の `export PATH=~/.npm-global/bin:$PATH` 設定がそのまま生きているので、Node 22 切替後も引き続き呼べる。

**副作用ゼロ確認**:
- `which cdk` → `/home/tetutetu/.npm-global/bin/cdk` ✓
- `which wrangler` → `/home/tetutetu/.npm-global/bin/wrangler` ✓

**戻し方**: `mv ~/.npmrc.bak ~/.npmrc` で完全復元可。

### 2026-05-12: `@crxjs/vite-plugin` 2.x の Rollup 4 脆弱性(GHSA-mw96-cpmx-2vgc)
**症状**: `npm install` 後の `npm audit` で high severity 2 件が出る。発生源は CRXjs 2.x が依存する Rollup 4 の Path Traversal。

**やってはいけないこと**: `npm audit fix --force` を打つと CRXjs を 1.0.14 にダウングレードする(2→1 の major down で破壊的変更)。

**判断**: このまま無視。理由:
- 攻撃ベクタは「ビルド時に悪意ある外部入力が path traversal を仕込む」だが、入力は自前で書く TS/JSON のみ
- 開発時のみ走るビルドツール内の脆弱性で、配布物には影響しない
- 本拡張は Web Store 公開せず Load Unpacked 個人運用

**監視**: 次回 `@crxjs/vite-plugin` を更新するときは npm advisories を再確認し、Rollup が修正版に上がっていれば自然解消。

### 2026-05-12: ESLint 9 flat config で `.prettierrc.json` を files に入れるとエラー
**症状**: `files: ['eslint.config.js', '.prettierrc.json']` で設定ファイル全般を typed-lint 対象外にしようとしたら、`.prettierrc.json` が JS としてパースされて `@typescript-eslint/no-unused-expressions` で fail。

**原因**: ESLint は files 指定された拡張子のファイルを **JS パーサで読む**。JSON ファイルを files に含めると JSON 構文が "expression" として解釈されてエラーになる。

**対処**: `.prettierrc.json` を files から外す(JSON を ESLint で lint する意味はない)。
```js
{
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
}
```

### 2026-05-12: Chrome 147 で LanguageModel API が `output language` 指定を要求する
**発見**: てつてつの実機(Chrome 147.0.7727.139)で `await LanguageModel.availability()` を実行すると `"available"` が返るが、Console に以下の警告が出る:
> No output language was specified in a LanguageModel API request. An output language should be specified to ensure optimal output quality and properly attest to output safety. Please specify a supported output language code: [en, es, ja]

**意味**:
- 出力言語の指定が**強く推奨**(現状は警告だが将来 error 化の可能性)
- サポート言語は `en` / `es` / `ja` のみ(中国語ローカライズ AWS Docs などはスコープ外で既に正解だった)

**実装への影響**:
1. `src/lib/prompt-api.ts` で `LanguageModel.create()` を呼ぶ際、出力言語に `ja` を指定する必要がある(おそらく `expectedOutputs: [{ type: 'text', languages: ['ja'] }]` 形だが、公式ドキュメントで確定させる)
2. `src/types/prompt-api.d.ts` の `LanguageModelCreateOptions` に対応プロパティを追加
3. spec 7.2 のセッション作成パラメータを minor 改訂

**M4 着手時の TODO**: https://developer.chrome.com/docs/ai/prompt-api を WebFetch で確認し、現行版の正確なオプション名を確定する。

---

## 4. 決定事項ログ

実装中にした重要な技術判断・設計判断をここに残す。

### 2026-05-12: Node 22 LTS 導入方式は nvm
**判断**: WSL の Node を v20.20.1 → v22.22.2(lts/jod)に切り替える際、`nvm` を採用。

**比較した代替案**: volta、システム置換(NodeSource apt)、Node 20 据え置き。

**採用理由**:
- バージョンマネージャなのでロールバックが容易(`nvm use 20` で戻せる)
- 他プロジェクト(mosaic-app / chicken-rag / trip-road)に影響を与えず併存できる
- `.nvmrc` をプロジェクトに置けば自動切替できる
- システム置換は不可逆性が高くリスクが大きい

**捨てたもの**: volta が持つ `package.json` の `volta` フィールド統合(現状不要)

### 2026-05-12: M1 で spec から逸脱した 2 点
**1. ESLint 設定ファイル名: spec 5 章の `.eslintrc.cjs` → 実装は `eslint.config.js`**
- 理由: ESLint 9 (採用版 9.39.4) は flat config が標準で、`.eslintrc.cjs` のレガシー形式は廃止予定。flat config 一択。
- 影響: 設定文法も別物(`module.exports` ではなく ESM の `export default`)。typescript-eslint も flat 用の `tseslint.config()` ヘルパで読み込む。

**2. `manifest.json` の `icons` セクションを M1 では除外**
- 理由: MV3 で `icons` は**必須ではない**(なければデフォルトのジグソーピースが使われる)。M1 のゴール「ビルドが通る + Load Unpacked できる」だけなら不要で、PNG ファイルを作る作業は M8 に回す。
- 復活させるタイミング: M8 (受け入れ条件チェック)で 16/48/128 px の PNG を `public/icons/` に置いてから manifest に追記。
- spec 6 章は将来像を示す参考として残し、実装側の manifest だけ M1 状態にしている。

---

## 5. 参考リンク(運用知見)

開発中に「これ知らなかった」「ハマったときに役立った」リンクをためる。

- Chrome Extension Samples の Prompt API 事例: https://github.com/GoogleChrome/chrome-extensions-samples
- CRXjs Vite Plugin Get Started: https://crxjs.dev/vite-plugin/getting-started
- chrome.sidePanel.setOptions の挙動: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
