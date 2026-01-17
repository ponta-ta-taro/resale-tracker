# ResaleTracker 開発引き継ぎメモ（最新）

> **運用ルール**
> - このファイル（HANDOVER.md）は常に最新の状態に上書き更新する
> - 過去の履歴はGit履歴で確認可能

---

## 🎉 現在の状態：本番稼働中

**ResaleTracker** - iPhone転売の価格管理・分析アプリ

---

## 本番URL

| サービス | URL |
|---------|-----|
| **Webサイト** | https://resale-tracker-opal.vercel.app |
| **GitHub** | https://github.com/ponta-ta-taro/resale-tracker |
| **Supabase** | https://supabase.com/dashboard （プロジェクト: resale-tracker） |
| **Render** | https://dashboard.render.com （サービス: resale-tracker-scraper） |
| **Cloudflare** | Email Worker: resale-email-worker / ドメイン: rt-mail.uk |

---

## 完了済み機能

### コア機能
- ✅ 価格自動スクレイピング（毎朝10時JST、Render Cron）
- ✅ 価格推移グラフ（Y軸レンジ選択対応）
- ✅ 在庫管理（CRUD、ステータス管理）
- ✅ Google認証 + RLS（ユーザーごとのデータ分離）

### 自動化機能
- ✅ Appleメール自動取り込み（Cloudflare Email Worker）
  - 注文確認メール → 在庫自動登録（ordered）
  - 出荷メール → ステータス更新（shipped）+ 追跡番号登録
- ✅ メール履歴管理（フィルター、カスタム期間対応）

### 管理機能
- ✅ 送料管理（発送単位で複数商品まとめ可能）
- ✅ ポイント・特典管理（ギフトカード還元、クレカポイント）
- ✅ 支払いスケジュール表示（カード締め日・支払日）
- ✅ 設定ページ統合（Apple ID、支払い方法、連絡先を1ページに）

### UI/UX
- ✅ ダッシュボード（今月の実績、在庫状況、資金状況、アラート、月別利益推移）
- ✅ 購入Apple IDに「ゲストID」を常に表示

---

## 📧 メール自動取り込みの構成
Apple（ゲスト購入）
↓
各Gmail（連絡先メールとして登録、10個以上）
↓ フィルター: @orders.apple.com のみ転送
import@rt-mail.uk（Cloudflare Email Worker）
↓
ResaleTracker API → 在庫自動登録 + メール履歴保存

---

## 🔴 残タスク

### 優先度：高
| タスク | 詳細 |
|--------|------|
| Gmail転送設定 | 残りのGmail（10個+）に@orders.apple.comのみ転送フィルター設定 |

### 優先度：中
| タスク | 詳細 |
|--------|------|
| 配達完了メール対応 | Appleから届いたら対応（arrived ステータス） |
| PDF読み取り修正 | pdf2jsonがVercelで動作しない問題 |

### 優先度：低（将来の拡張）
| タスク | 詳細 |
|--------|------|
| ヤマト・佐川メール取り込み | 発送ステータス自動更新 |
| モバイルミックス入金メール取り込み | 入金ステータス自動更新（paid） |
| Phase 6: 価格予測（Azure ML） | 過去データから価格トレンド予測 |

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| グラフ | Recharts |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth (Google OAuth) |
| メール処理 | Cloudflare Email Worker + カスタムドメイン(rt-mail.uk) |
| スクレイピング | Playwright (Python) |
| 定期実行 | Render Cron Job（毎日AM10時JST） |
| ホスティング | Vercel (フロント) / Render (スクレイパー) |

---

## データベーステーブル

| テーブル | 用途 |
|---------|------|
| inventory | 在庫管理 |
| price_history | 価格履歴（全ユーザー共有） |
| apple_accounts | Apple ID管理（メールアドレスはNULL許容） |
| payment_methods | 支払い方法 |
| contact_emails | 連絡先メールアドレス |
| contact_phones | 連絡先電話番号 |
| shipments | 発送管理 |
| rewards | ポイント・特典 |
| email_logs | メール履歴 |

---

## 環境変数

### Vercel
NEXT_PUBLIC_SUPABASE_URL=https://sudycxugnvprrrrlkdmm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（Supabaseのanon key）

### Render
SUPABASE_URL=https://sudycxugnvprrrrlkdmm.supabase.co
SUPABASE_KEY=（Supabaseのanon key）

### Cloudflare Email Worker
RESALE_TRACKER_API_URL=https://resale-tracker-opal.vercel.app
RESALE_TRACKER_API_KEY=（APIキー）

---

## 注意事項

### 認証関連
- Google Cloud Consoleプロジェクト: `ResaleTracker`（ID: resaletracker-484107）
- Supabase Callback URL: `https://sudycxugnvprrrrlkdmm.supabase.co/auth/v1/callback`

### スクレイピング
- 毎朝10時（JST）に自動実行
- 現在12機種の価格を取得中

---

## Antigravityへの指示テンプレート
[タスクの説明]
やること

xxx
xxx

修正ファイル

xxx.tsx
xxx.ts

確認なしでAll Acceptで進めて、完了したらGitHubにプッシュして報告

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026/01/10 | Phase 1〜4完了、Vercel/Renderデプロイ完了 |
| 2026/01/11 | 本番稼働確認 |
| 2026/01/12 | Google認証機能追加、RLS設定、価格推移グラフ改善 |
| 2026/01/17 | メール自動取り込み完成、送料管理、ポイント管理、設定ページ統合、ゲストID対応 |
