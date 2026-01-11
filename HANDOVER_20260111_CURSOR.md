# ResaleTracker 引き継ぎドキュメント（Cursor開発用）
## 2026年1月11日

---

## プロジェクト概要

**ResaleTracker** - iPhone転売ビジネス向け価格管理・分析アプリケーション

- **本番URL**: https://resale-tracker-opal.vercel.app
- **GitHub**: https://github.com/ponta-ta-taro/resale-tracker
- **技術スタック**: Next.js 14, TypeScript, Tailwind CSS, Supabase, Recharts

---

## 現在の実装状況

### ✅ 完了済み

| 機能 | 説明 |
|------|------|
| Phase 1-4 | プロジェクトセットアップ、スクレイピング、デプロイ、フロントエンド |
| Phase 5: 在庫管理 | 在庫登録・編集・削除、ステータス管理 |
| Phase 5.5: Appleメール読み取り | 注文メール・出荷メールの自動解析 |
| 共通ヘッダーナビゲーション | 全ページに統一ナビゲーション |
| ダッシュボード強化 | 今月の実績、在庫状況（出荷済み含む）、資金状況、アラート、月別利益推移グラフ |
| 注文時の予想売価 + 現在の相場 | 登録時の相場を保存、最新相場との比較表示 |
| 出荷メール対応 | 追跡番号・配送業者の自動登録、ステータス更新 |

### 🔄 保留中・未完了

| 優先度 | タスク | 状態 | 詳細 |
|--------|--------|------|------|
| **高** | PDF読み取り修正 | エラー対応必要 | pdf2jsonライブラリに変更済みだが、Vercelで動作しない |
| **高** | 配達完了メール対応 | 未実装 | メールが届いたら対応 |
| **低** | 認証機能 | 未実装 | Googleログイン + Supabase RLSでデータ分離 |

---

## データベース構造（Supabase）

### inventoryテーブル

```sql
id: uuid (PK)
model_name: text (機種名)
storage: text (容量)
color: text (色)
imei: text (IMEI)
status: text (ordered/shipped/arrived/selling/sold/paid)
purchase_price: integer (仕入価格)
expected_price: integer (注文時の予想売価)
actual_price: integer (実売価格)
purchase_source: text (仕入先)
order_number: text (Apple注文番号)
order_date: date (注文日)
expected_delivery_start: date (お届け予定日・開始)
expected_delivery_end: date (お届け予定日・終了)
payment_card: text (支払いカード)
sold_to: text (販売先・買取業者)
tracking_number: text (配送伝票番号)
carrier: text (配送業者)
serial_number: text (シリアル番号)
arrived_at: date (納品日)
sold_at: date (売却日)
paid_at: date (入金日)
notes: text (備考)
created_at: timestamp
updated_at: timestamp
```

### price_historyテーブル

```sql
id: uuid (PK)
model_name: text (機種名)
storage: text (容量)
price: integer (買取価格)
captured_at: timestamp (取得日時)
```

---

## ファイル構成

```
resale-tracker/
├── app/
│   ├── page.tsx                    # ダッシュボード
│   ├── prices/page.tsx             # 価格一覧
│   ├── inventory/
│   │   ├── page.tsx                # 在庫一覧
│   │   ├── new/page.tsx            # 在庫新規登録
│   │   └── [id]/page.tsx           # 在庫詳細・編集
│   └── api/
│       ├── dashboard/route.ts      # ダッシュボードAPI
│       ├── inventory/
│       │   ├── route.ts            # 在庫一覧・登録API
│       │   ├── [id]/route.ts       # 在庫詳細・更新・削除API
│       │   ├── search/route.ts     # 注文番号で検索API
│       │   └── summary/route.ts    # サマリーAPI
│       ├── parse-pdf/route.ts      # PDF解析API（要修正）
│       └── prices/route.ts         # 価格API
├── components/
│   ├── Header.tsx                  # 共通ヘッダー
│   ├── InventoryTable.tsx          # 在庫テーブル
│   ├── InventoryForm.tsx           # 在庫フォーム
│   ├── InventorySummaryCard.tsx    # サマリーカード
│   └── AppleMailImporter.tsx       # Appleメール読み取り
├── lib/
│   ├── supabase.ts                 # Supabaseクライアント
│   └── appleMailParser.ts          # Appleメールパーサー
├── types/
│   └── index.ts                    # 型定義
└── scraper/                        # 価格スクレイピング
```

---

## 環境変数

`.env.local` に以下が必要：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# GitHubにプッシュ（Vercelに自動デプロイ）
git add .
git commit -m "feat: 機能説明"
git push origin main
```

---

## 次回やるべきこと

### 1. PDF読み取り修正（優先度: 高）

**問題**: pdf2jsonライブラリがVercelサーバーレス環境で動作しない

**解決方法の候補**:
- クライアントサイドでPDF解析（pdf.jsを使用）
- 外部サービス（AWS Lambda等）でPDF解析
- 手動入力で対応（一時的）

### 2. 配達完了メール対応（優先度: 高）

配達完了メールが届いたら：
- メールの形式を確認
- appleMailParser.tsに配達完了メールの判別ロジックを追加
- ステータスを「納品済み（arrived）」に更新
- 納品日（arrived_at）を自動設定

### 3. 認証機能（優先度: 低）

- Supabase Authの設定
- Googleログインの実装
- Row Level Security（RLS）でユーザーごとのデータ分離
- 将来的には課金システム（Stripe）と連携

---

## Appleメールの種類と対応状況

| メール種類 | 対応状況 | ステータス変更 |
|-----------|---------|---------------|
| ご注文確認メール | ✅ 対応済み | → ordered |
| ご注文ありがとうメール | ✅ 対応済み | → ordered |
| 出荷完了メール | ✅ 対応済み | → shipped |
| 請求書PDF | ❌ 要修正 | シリアル番号登録 |
| 配達完了メール | ❌ 未実装 | → arrived |

---

## 注意事項

- Vercelの無料プランを使用中
- Supabaseの無料プランを使用中
- 本番データがあるため、DB変更は慎重に

---

## 連絡事項

- 配達完了メールが届いたら、その内容を共有してください
- 新しい機能のアイデアがあれば、優先度を決めて追加します
