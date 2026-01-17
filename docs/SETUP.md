# ResaleTracker V2 - 環境構築ガイド

## 1. 必要なアカウント

| サービス | 用途 | URL |
|---------|------|-----|
| GitHub | ソースコード管理 | https://github.com |
| Supabase | データベース・認証 | https://supabase.com |
| Vercel | フロントエンドホスティング | https://vercel.com |
| Cloudflare | メール受信（Email Workers） | https://cloudflare.com |
| Render | 価格スクレイピング（Cron） | https://render.com |
| Google Cloud | OAuth認証 | https://console.cloud.google.com |

---

## 2. ローカル開発環境

### 2.1 前提条件

- Node.js 18+
- npm または yarn
- Git

### 2.2 リポジトリのクローン

```bash
git clone https://github.com/ponta-ta-taro/resale-tracker.git
cd resale-tracker
```

### 2.3 依存パッケージのインストール

```bash
npm install
```

### 2.4 環境変数の設定

`.env.local` を作成：

```bash
cp .env.local.example .env.local
```

以下を設定：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.5 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

---

## 3. Supabase セットアップ

### 3.1 プロジェクト作成

1. https://supabase.com にログイン
2. 「New Project」をクリック
3. 以下を設定：
   - Name: `resale-tracker`
   - Region: `Northeast Asia (Tokyo)`
   - Database Password: 安全なパスワードを設定

### 3.2 テーブル作成

SQL Editor で以下を実行（DATABASE.md を参照）：

```sql
-- inventory テーブル
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  inventory_code TEXT NOT NULL UNIQUE,
  order_number TEXT NOT NULL,
  item_index INTEGER NOT NULL DEFAULT 1,
  -- ... (DATABASE.md参照)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(order_number, item_index)
);

-- 他のテーブルも同様に作成
```

### 3.3 RLS ポリシー設定

```sql
-- inventory テーブルのRLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory"
  ON inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON inventory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON inventory FOR DELETE
  USING (auth.uid() = user_id);
```

### 3.4 Google OAuth 設定

1. Authentication → Providers → Google を有効化
2. Google Cloud Console で OAuth 2.0 クライアントを作成
3. Authorized redirect URI に以下を追加：
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
4. Client ID と Client Secret を Supabase に設定

---

## 4. Vercel セットアップ

### 4.1 プロジェクト作成

1. https://vercel.com にログイン
2. 「Import Project」→ GitHub リポジトリを選択
3. Framework Preset: `Next.js`

### 4.2 環境変数設定

Settings → Environment Variables で以下を追加：

| 変数名 | 値 |
|--------|-----|
| NEXT_PUBLIC_SUPABASE_URL | Supabase の Project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase の anon key |

### 4.3 デプロイ

- `main` ブランチへのプッシュで自動デプロイ
- カスタムドメインは Settings → Domains で設定

---

## 5. Cloudflare Email Workers セットアップ

### 5.1 ドメイン追加

1. Cloudflare にドメインを追加（例: rt-mail.uk）
2. DNS を Cloudflare に向ける

### 5.2 Email Routing 設定

1. Email → Email Routing を有効化
2. Catch-all を「Worker」に設定

### 5.3 Worker 作成

```bash
cd cloudflare-worker
npm install
npx wrangler publish
```

### 5.4 環境変数設定

```bash
npx wrangler secret put RESALE_TRACKER_API_URL
# https://resale-tracker-opal.vercel.app/api/mail/webhook

npx wrangler secret put RESALE_TRACKER_API_KEY
# 任意のAPIキー
```

---

## 6. Render セットアップ（価格スクレイピング）

### 6.1 Background Worker 作成

1. https://render.com で「New」→「Background Worker」
2. GitHub リポジトリを接続
3. Root Directory: `scraper`
4. Build Command: `pip install -r requirements.txt && playwright install chromium`
5. Start Command: `python main.py`

### 6.2 環境変数設定

| 変数名 | 値 |
|--------|-----|
| SUPABASE_URL | Supabase の Project URL |
| SUPABASE_KEY | Supabase の service_role key |

### 6.3 Cron 設定

Settings → Cron で以下を設定：

```
0 1 * * *
```

（UTC 1:00 = JST 10:00）

---

## 7. Gmail 転送設定

各 Gmail アカウントで以下を設定：

### 7.1 フィルター作成

1. Gmail → 設定 → フィルタとブロック中のアドレス
2. 「新しいフィルターを作成」
3. From: `@orders.apple.com OR @email.apple.com`
4. 「転送先」: `import@rt-mail.uk`

### 7.2 転送先の確認

1. 初回は確認メールが届く
2. 確認リンクをクリックして有効化

---

## 8. トラブルシューティング

### ビルドエラー

```bash
# キャッシュクリア
rm -rf .next node_modules
npm install
npm run build
```

### Supabase 接続エラー

- 環境変数が正しく設定されているか確認
- Supabase の API Settings で URL と Key を再確認

### メールが届かない

1. Cloudflare Worker のログを確認
2. Gmail の転送設定が有効か確認
3. Supabase の email_logs テーブルを確認

### Render の Cron が動かない

1. Render のログを確認
2. 手動で「Trigger Job」を実行してテスト
