# ResaleTracker

iPhone転売ビジネスのための価格管理・分析アプリケーション

## 概要

モバイルミックス（https://mobile-mix.jp/）の買取価格を自動収集し、価格推移の可視化、在庫管理、利益計算を行います。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase (PostgreSQL)
- **グラフ**: Recharts
- **日付処理**: date-fns

## セットアップ

1. 依存パッケージのインストール:
```bash
npm install
```

2. 環境変数の設定:
`.env.local.example`を`.env.local`にコピーし、Supabaseの接続情報を設定してください。

```bash
cp .env.local.example .env.local
```

3. 開発サーバーの起動:
```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## 開発フェーズ

このプロジェクトは6つのフェーズに分けて開発を進めます:

- **Phase 1**: プロジェクト初期セットアップ ✅
- **Phase 2**: 自動スクレイピング（Playwright + OCR）
- **Phase 3**: Renderデプロイ + 定期実行
- **Phase 4**: フロントエンド（価格グラフ・一覧表示）
- **Phase 5**: 在庫管理機能
- **Phase 6**: 価格予測（Azure ML）

詳細は`PHASES.md`を参照してください。

## ドキュメント

- `SPEC.md`: プロジェクト仕様書
- `PHASES.md`: 開発フェーズ定義
- `RULES.md`: コーディングルール
- `DEV_LOG.md`: 開発ログ

## ライセンス

Private
