# ResaleTracker 開発引き継ぎメモ（最新）

> **運用ルール**
> - このファイル（HANDOVER.md）は常に最新の状態に上書き更新する
> - 大きな節目（Phase完了など）の時だけ `docs/handover/` にアーカイブをコピー
> - 過去の履歴は `docs/handover/` または Git履歴で確認可能

---

## 🚧 現在の状態：Phase 1 完了 → Phase 2 準備中

**ResaleTracker V2** - iPhone転売の在庫管理・利益分析アプリ

前バージョンでDBスキーマの不整合が多発したため、ドキュメントを整備した上でゼロからリビルド中。

---

## 本番URL

| サービス | URL |
|---------|-----|
| **Webサイト** | https://resale-tracker-opal.vercel.app |
| **GitHub** | https://github.com/ponta-ta-taro/resale-tracker |
| **Supabase** | https://supabase.com/dashboard （プロジェクト: resale-tracker） |
| **Render** | https://dashboard.render.com （サービス: resale-tracker-scraper） |
| **Cloudflare** | Email Worker（import@rt-mail.uk） |

---

## V2リビルド：決定事項まとめ

### 実装フェーズ

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

### 技術的決定事項

| 項目 | 決定内容 |
|------|----------|
| **ステータス管理** | 最初は `ordered → shipped` でシンプルに。後からApple注文URLスクレイピングで9段階追加予定 |
| **PDF処理** | Cloudflare Worker側で実装（クライアントサイドpdf.jsより統合しやすい） |
| **優先メール** | Apple Guest注文（Gmail）が最優先で自動化 |
| **既存データ** | `price_history`テーブルのみ保持、`inventory`は破棄OK |

### item_index決定ロジック（最終版）

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

### Cloudflare Workerの現状

- メール受信 → パース → APIにPOST まで実装済み
- Phase 2では既存Workerを拡張・改修する形で進める（ゼロからではない）

### 作業の進め方

- **段階的に進める**（Phase 1完了 → 確認 → Phase 2）
- 一気に任せるとDBとWorkerの問題切り分けが難しくなるため

### Supabaseプロジェクト

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

## 現在の進捗

### ✅ 完了済み

- [x] V2用ドキュメント整備（SPEC.md, DATABASE.md, API.md, RULES.md, SETUP.md）
- [x] メールサンプル整理（apple-account, apple-guest-gmail, amazon）
- [x] 実装方針・フェーズ順序の決定
- [x] item_indexロジックの確定
- [x] **Phase 1: DB基盤構築**
  - [x] 新テーブル8つ作成（inventory, apple_accounts, contact_emails, contact_phones, payment_methods, shipments, rewards, email_logs）
  - [x] RLSポリシー設定完了
  - [x] 既存inventoryテーブルをinventory_v1_backupにリネーム
- [x] **在庫管理UI構築**
  - [x] 在庫一覧ページ（9ステータス対応フィルター）
  - [x] 在庫登録フォーム
  - [x] 在庫詳細・編集ページ
  - [x] ステータス進捗バーコンポーネント
  - [x] ヘッダーナビゲーション統一

### 🔄 次にやること：Phase 2 - メール自動取り込み

1. **メール受信API作成**（/api/mail/webhook）
2. **Appleメールパーサー実装**
   - 注文確認メール → 在庫レコード作成
   - 出荷通知メール → ステータス更新 + 追跡番号
3. **Cloudflare Worker改修**
4. **docs/email-samples/ を使ったテスト**

---

## 注意事項

### 保持するデータ
- `price_history`テーブル：モバイルミックスからのスクレイピングデータ（毎朝10時自動取得）
- `users`関連：認証情報

### 破棄してOKなデータ
- `inventory`テーブル：V1のテストデータのみ、本番運用データなし

### Antigravityの制限
- Claude Sonnet 4.5は制限中の場合あり
- 代わりにGemini 3 Flash/Proを使用可能

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

---

## 参照ドキュメント

| ファイル | 内容 |
|----------|------|
| `docs/SPEC.md` | V2仕様書（要件、機能、画面構成） |
| `docs/DATABASE.md` | テーブル定義（9テーブル） |
| `docs/API.md` | APIエンドポイント一覧 |
| `docs/RULES.md` | コーディング規約 |
| `docs/SETUP.md` | 環境構築手順 |
| `docs/email-samples/` | メールサンプル（apple-account, apple-guest-gmail, amazon） |

---

## Antigravityへの指示テンプレート

```
[タスクの説明]

## 参照ドキュメント
- docs/DATABASE.md
- docs/SPEC.md

## やること
1. xxx
2. xxx

## 修正ファイル
- xxx.tsx
- xxx.ts

## 完了したらプッシュして報告
```

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026/01/10 | Phase 1〜4完了、Vercel/Renderデプロイ完了 |
| 2026/01/11 | 本番稼働確認、引き継ぎメモ作成 |
| 2026/01/12 | Google認証機能追加、RLS設定、価格推移グラフ改善 |
| 2026/01/17 | V2リビルド方針決定、ドキュメント整備完了、Phase順序・item_indexロジック確定 |
| 2026/01/18 | Phase 1完了（DB基盤 + 在庫管理UI）、Phase 2準備 |
