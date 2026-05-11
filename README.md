# AWS Docs Companion

Chrome 内蔵 LLM(Gemini Nano)で AWS 公式ドキュメント・公式ブログをローカル要約する Chrome 拡張機能。Load Unpacked 専用、個人用ツール。

## できること

- AWS 公式ドキュメント(`docs.aws.amazon.com`)、AWS ブログ(英語/日本語)、Builders' Library、Architecture Center を開いたとき、サイドパネルから「要約する」ボタン 1 クリックで現在のページを中学生レベルに要約
- 「1 段落の要点」+「3 つのポイント」フォーマットで出力
- ストリーミング表示・コピー・再要約に対応
- LLM 呼び出しは完全ローカル(外部 API 通信なし)

## 動作環境

- Chrome 138 以上(Built-in Prompt API)
- Windows 10/11(VRAM 4 GB+ / RAM 16 GB+ / 空きストレージ 22 GB+)
- Node.js 22 LTS(ビルド時のみ)

## セットアップ・使い方

詳細は `docs/` 配下:

- 要件定義: [`docs/spec.md`](docs/spec.md)
- 実装計画: [`docs/plan.md`](docs/plan.md)
- 開発知見: [`docs/knowledge.md`](docs/knowledge.md)

## ライセンス

個人用。公開を想定しないため未設定。
