# ResaleTracker V2 決定事項・技術詳細

このドキュメントはV2リビルドにおける技術的決定事項と詳細をまとめたものです。

---

## 実装フェーズ

```
Phase 1: DB基盤（1日）
├── 新テーブル作成（inventory_v2, contact_emails等）
├── 型定義更新
└── RLSポリシー設定

Phase 2: メール自動取り込み（2-3日）★最重要
├── Cloudflare Worker改修
│   ├── Appleゲスト注文確認メール
│   ├── Apple出荷通知メール
│   └── PDF添付（シリアル番号）
├── Gmail転送設定（全アカウント）
└── email_logsテーブル

Phase 3: 在庫管理UI（2-3日）
├── 在庫一覧（新ステータス対応）
├── 在庫登録フォーム
├── ステータス進捗バー
└── 手動メールアップロード機能

Phase 4: 補助機能（1-2日）
├── 送料管理
├── ポイント・特典
└── ダッシュボード
```

---

## 技術的決定事項

| 項目 | 決定内容 |
|------|----------|
| **ステータス管理** | 最初は `ordered → shipped` でシンプルに。後からApple注文URLスクレイピングで9段階追加予定 |
| **PDF処理** | Cloudflare Worker側で実装（クライアントサイドpdf.jsより統合しやすい） |
| **優先メール** | Apple Guest注文（Gmail）が最優先で自動化 |
| **既存データ** | `price_history`テーブルのみ保持、`inventory`は破棄OK |

---

## item_index決定ロジック（最終版）

```
1. 注文確認メール受信時:
   - 商品リストをパース
   - 出現順にitem_index = 1, 2, 3...を割り当て
   - レコード作成（シリアル番号は空）

2. 請求書PDF受信時:
   - "Serial Numbers for Item 000010" → item_index = 1
   - "Serial Numbers for Item 000020" → item_index = 2
   - 対応するレコードにシリアル番号を更新
```

**ポイント**: Appleの「Item 00001X」の末尾1桁がそのままitem_indexになる

---

## Cloudflare Workerの現状

- メール受信 → パース → APIにPOST まで実装済み
- Phase 2では既存Workerを拡張・改修する形で進める（ゼロからではない）

---

## 作業の進め方

- **段階的に進める**（Phase 1完了 → 確認 → Phase 2）
- 一気に任せるとDBとWorkerの問題切り分けが難しくなるため

---

## Supabaseプロジェクト

- **既存プロジェクト（resale-tracker）をそのまま使う**
- 新規プロジェクト作成はしない
- 理由：`price_history`保持、認証設定済み、環境変数変更不要

**テーブル移行方針：**
```
price_history → そのまま保持
inventory → inventory_v1_backup にリネーム（後で削除）
inventory_v2 → 新規作成
contact_emails → 新規作成
email_logs → 新規作成
その他V2テーブル → 新規作成
```

---

## email_logs テーブルの実際の構造

**注意**: DATABASE.md と異なるため、実際の構造を記載：

| カラム名 | 型 | 説明 |
|----------|-----|------|
| id | uuid | PK |
| user_id | uuid | RLS用 |
| email_type | text | 'order' / 'shipping' / 'invoice' / 'unknown' |
| subject | text | 件名 |
| sender | text | 送信元（連絡先Gmail） |
| order_number | text | 抽出した注文番号 |
| raw_content | text | 生メール内容 |
| parsed_data | jsonb | パース結果（inventory_id等） |
| status | text | 'success' / 'skipped' / 'error' |
| error_message | text | エラーメッセージ |
| received_at | timestamp | 受信日時 |
| processed_at | timestamp | 処理日時 |
| created_at | timestamp | 作成日時 |

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| グラフ | Recharts |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth (Google OAuth) |
| メール処理 | Cloudflare Email Workers（import@rt-mail.uk） |
| スクレイピング | Playwright (Python) on Render |
| 定期実行 | Render Cron Job（毎日AM10時JST） |
| ホスティング | Vercel (フロント) / Render (スクレイパー) |
