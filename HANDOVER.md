# ResaleTracker 開発引き継ぎメモ（最新）

> **運用ルール**
> - このファイル（HANDOVER.md）は常に最新の状態に上書き更新する
> - 大きな節目（Phase完了など）の時だけ `docs/handover/` にアーカイブをコピー
> - 過去の履歴は `docs/handover/` または Git履歴で確認可能

---

## 🎉 現在の状態：本番稼働中 + 認証機能追加完了

**ResaleTracker** - iPhone転売の価格管理・分析アプリ

---

## 本番URL

| サービス | URL |
|---------|-----|
| **Webサイト** | https://resale-tracker-opal.vercel.app |
| **GitHub** | https://github.com/ponta-ta-taro/resale-tracker |
| **Supabase** | https://supabase.com/dashboard （プロジェクト: resale-tracker） |
| **Render** | https://dashboard.render.com （サービス: resale-tracker-scraper） |

---

## 最近の完了タスク（2026/01/12）

### ✅ Google認証機能
- Google Cloud ConsoleでOAuth設定
- SupabaseでGoogle認証を有効化
- ログインページ作成（`app/login/page.tsx`）
- middleware追加（認証チェック）
- 名称を「iPhone販売価格管理システム」に変更

### ✅ RLS（Row Level Security）設定
- `inventory`テーブル: ユーザーごとにデータ分離
- `price_history`テーブル: 全ユーザーで共有（閲覧のみ）
- 既存データ（3件）を自分のuser_idに紐付け済み

### ✅ 価格API修正
- `/api/prices`がRLS環境で動作するように修正
- `createServerSupabaseClient`を使用してセッション情報を渡す

### ✅ 価格推移グラフ改善
- Y軸レンジ選択機能追加（自動調整/全体表示/カスタム）
- 同じ日付の最新データを表示するバグ修正
- 「選択をクリア」ボタンの動作修正

### ✅ Render cron設定確認
- 毎朝10時（JST）に実行: `0 1 * * *`（UTC 1:00）

---

## 技術的な変更点

### 新規作成ファイル
```
lib/supabase-server.ts      # サーバー用Supabaseクライアント
components/AuthProvider.tsx  # 認証コンテキストプロバイダー
app/login/page.tsx          # ログインページ
app/auth/callback/route.ts  # 認証コールバック
middleware.ts               # 認証チェックミドルウェア
```

### 変更ファイル
```
lib/supabase.ts             # ブラウザ用クライアントに変更
app/layout.tsx              # AuthProvider追加
components/Header.tsx       # ログアウトボタン追加
components/PriceChart.tsx   # Y軸レンジ選択、バグ修正
app/api/prices/route.ts     # RLS対応
app/api/prices/latest/route.ts
app/api/inventory/route.ts
app/api/inventory/[id]/route.ts
app/api/inventory/search/route.ts
app/api/inventory/summary/route.ts
app/api/dashboard/route.ts
```

### データベース変更
- `inventory`テーブルに`user_id`カラム追加済み
- RLSポリシー設定済み

---

## 次にやるべきタスク

### 🔴 優先度：高

#### 1. メール自動取り込み機能
**構成**: iCloud → Gmail転送 → n8n → ResaleTracker API → Supabase

**対象メール4種類**:
| # | 件名 | 処理内容 |
|---|------|----------|
| 1 | ご注文ありがとうございます | 注文データ取り込み → ステータス「ordered」 |
| 2 | お客様の商品は配送中です | 追跡情報取り込み → ステータス「shipped」 |
| 3 | 請求金額のお知らせ | PDF解析 → シリアル番号・IMEI登録 |
| 4 | ご購入時の体験はいかがでしたか？ | アンケートリマインダー表示 |

**実装ステップ**:
1. iCloud → Gmail転送設定
2. メール受信用APIエンドポイント作成
3. 既存のappleMailParser.tsを拡張
4. n8nフロー構築（Gmail監視 → 件名で分岐 → API呼び出し）
5. ダッシュボードにアンケートリマインダー表示

#### 2. 送料管理機能
**要件**:
- 複数商品を1つの発送にまとめられる
- 発送単位で送料を記録
- ダッシュボード表示:
  - 粗利益（商品のみ）
  - 純利益（送料込み）

#### 3. ポイント・特典管理機能（端末管理とは分離）
**要件**:
- ギフトカード購入履歴と還元を記録
- クレカ決済のポイントを記録
- 月単位で合計表示
- 端末の損益とは別枠で表示

**ダッシュボード表示イメージ**:
```
【商品損益】
粗利益: ¥30,000 / 純利益: ¥25,000

【ポイント・特典（今月）】
ギフトカード還元: ¥5,000
クレカポイント: ¥3,000
合計: ¥8,000
```

### 🟡 優先度：中

#### 4. PDF読み取り修正
- pdf2jsonがVercelで動作しない問題
- クライアントサイドでpdf.jsを使用する方向で検討中

### 🟢 優先度：低

#### 5. Phase 6: 価格予測（Azure ML）
- 過去の価格データから将来の価格トレンドを予測

---

## 注意事項

### Antigravityの制限
- Claude Sonnet 4.5は1/19/2026まで制限中
- 代わりにGemini 3 FlashまたはGemini 3 Proを使用可能

### 認証関連
- Google Cloud Consoleプロジェクト: `ResaleTracker`（ID: resaletracker-484107）
- Supabase Callback URL: `https://sudycxugnvprrrrlkdmm.supabase.co/auth/v1/callback`

### スクレイピング
- 毎朝10時（JST）に自動実行
- 現在12機種の価格を取得中

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| グラフ | Recharts |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth (Google OAuth) |
| スクレイピング | Playwright (Python) |
| 定期実行 | Render Cron Job（毎日AM10時JST） |
| ホスティング | Vercel (フロント) / Render (スクレイパー) |

---

## Antigravityへの指示テンプレート

```
[タスクの説明]

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
| 2026/01/17 | メール履歴修正、設定ページ統合、UI改善 |
