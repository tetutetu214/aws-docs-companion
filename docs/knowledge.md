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
WSL ターミナルで:
```bash
node -v
```
`v22.x.x` が表示されること。未インストールなら以下のいずれかで導入:
```bash
# nvm を使う場合
nvm install 22
nvm use 22

# volta を使う場合
volta install node@22
```

---

## 2. 学習済み概念

理解度テストハーネスで全問正解した技術概念をここに蓄積する(次回以降テストスキップ判定に使う)。

| 概念 | 確認日 | メモ |
|---|---|---|
| (まだなし) | | |

---

## 3. ハマったポイント・試行錯誤

実装中に得た知見をここに追記していく。同じ失敗を繰り返さないために。

(まだなし)

---

## 4. 決定事項ログ

実装中にした重要な技術判断・設計判断をここに残す。

(まだなし)

---

## 5. 参考リンク(運用知見)

開発中に「これ知らなかった」「ハマったときに役立った」リンクをためる。

- Chrome Extension Samples の Prompt API 事例: https://github.com/GoogleChrome/chrome-extensions-samples
- CRXjs Vite Plugin Get Started: https://crxjs.dev/vite-plugin/getting-started
- chrome.sidePanel.setOptions の挙動: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
