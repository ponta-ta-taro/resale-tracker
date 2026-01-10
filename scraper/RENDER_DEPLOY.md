# Renderデプロイガイド - ResaleTracker Scraper

## 概要

このガイドでは、ResaleTrackerのスクレイパーをRenderにデプロイし、毎日自動で価格データを収集する設定を行います。

---

## 前提条件

- ✅ GitHubリポジトリが作成されている
- ✅ Supabaseプロジェクトが設定されている
- ✅ `price_history`テーブルが作成されている
- ✅ ローカルで`python main.py`が正常に動作する

---

## デプロイ手順

### 1. GitHubにプッシュ

```bash
git add .
git commit -m "feat: Renderデプロイ設定を追加"
git push origin main
```

### 2. Renderアカウント作成

1. https://render.com にアクセス
2. GitHubアカウントで登録

### 3. 新しいCron Jobを作成

#### 方法1: Blueprint（推奨）

1. Renderダッシュボードで「New +」→「Blueprint」を選択
2. GitHubリポジトリを接続
3. `render.yaml`が自動検出される
4. 環境変数を設定:
   - `SUPABASE_URL`: `https://sudycxugnvprrrrlkdmm.supabase.co`
   - `SUPABASE_KEY`: （Supabaseのanon public key）
5. 「Apply」をクリック

#### 方法2: 手動設定

1. Renderダッシュボードで「New +」→「Cron Job」を選択
2. GitHubリポジトリを接続
3. 以下の設定を入力:

**基本設定:**
- **Name**: `resale-tracker-scraper`
- **Environment**: `Docker`
- **Dockerfile Path**: `./scraper/Dockerfile`
- **Docker Context**: `./scraper`

**スケジュール:**
- **Schedule**: `0 1 * * *`（毎日 AM 1:00 UTC = AM 10:00 JST）

**環境変数:**
- `SUPABASE_URL`: `https://sudycxugnvprrrrlkdmm.supabase.co`
- `SUPABASE_KEY`: （Supabaseのanon public key）

4. 「Create Cron Job」をクリック

### 4. 初回実行テスト

1. Renderダッシュボードで作成したCron Jobを開く
2. 「Trigger Run」をクリックして手動実行
3. ログを確認:
   ```
   [1/2] 価格情報を抽出中...
   ✓ 12件の価格情報を抽出しました
   [2/2] データベースに保存中...
   ✓ 12件をデータベースに保存しました
   ```

### 5. 動作確認

1. Supabaseダッシュボード → Table Editor → `price_history`
2. 新しいデータが保存されていることを確認

---

## トラブルシューティング

### Dockerビルドエラー

**症状**: `Error building Docker image`

**解決方法**:
- Dockerfile内のパスが正しいか確認
- `requirements.txt`が存在するか確認

### Playwright/Chromiumエラー

**症状**: `Executable doesn't exist`

**解決方法**:
- Dockerfileで`playwright install chromium`が実行されているか確認
- `playwright install-deps chromium`が実行されているか確認

### Supabase接続エラー

**症状**: `Invalid API key`

**解決方法**:
- Render環境変数が正しく設定されているか確認
- Supabaseのanon public keyを使用しているか確認

### タイムゾーンの確認

**UTC → JST変換:**
- UTC 1:00 = JST 10:00
- UTC 0:00 = JST 9:00
- UTC 2:00 = JST 11:00

---

## 監視とログ

### ログの確認

1. Renderダッシュボード → Cron Job
2. 「Logs」タブで実行ログを確認

### 実行履歴

1. 「Jobs」タブで過去の実行履歴を確認
2. 成功/失敗のステータスを確認

### アラート設定（オプション）

Renderは失敗時に自動でメール通知を送信します。

---

## コスト

Renderの無料プランでは:
- Cron Jobは月750時間まで無料
- 1日1回の実行なら十分無料枠内

---

## 次のステップ

Phase 3完了後、以下を確認:
- ✅ 毎日AM 10:00（JST）に自動実行される
- ✅ 価格データがSupabaseに保存される
- ✅ エラーが発生した場合にログで確認できる

Phase 4以降でフロントエンドを実装し、保存されたデータを可視化します。
