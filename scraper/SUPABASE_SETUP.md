# Supabase セットアップガイド

## 現在の状況

✅ **価格抽出**: 12件のiPhone価格を正常に抽出
❌ **データベース保存**: API keyが無効のため保存できていません

## 必要な設定

### 1. Supabase API Keyの取得

1. https://supabase.com/dashboard にアクセス
2. プロジェクト「sudycxugnvprrrrlkdmm」を選択
3. 左メニューから「Settings」→「API」を選択
4. 「Project API keys」セクションで以下をコピー:
   - **Project URL**: `https://sudycxugnvprrrrlkdmm.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` で始まる長いキー

### 2. .envファイルの更新

`scraper/.env` ファイルを以下のように更新:

```env
SUPABASE_URL=https://sudycxugnvprrrrlkdmm.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（ここに正しいanon keyを貼り付け）
```

> **重要**: `SUPABASE_KEY` は `eyJ` で始まる非常に長い文字列です。
> `sb_publishable_` で始まるキーは**古い形式**で使用できません。

### 3. price_historyテーブルの作成

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `scraper/setup_database.sql` の内容をコピー
3. SQL Editorに貼り付けて実行

または、以下のSQLを直接実行:

```sql
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  storage TEXT NOT NULL,
  price INTEGER NOT NULL,
  color_note TEXT,
  captured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_history_model 
  ON price_history(model_name);

CREATE INDEX IF NOT EXISTS idx_price_history_captured_at 
  ON price_history(captured_at DESC);
```

### 4. 動作確認

設定完了後、以下のコマンドでテスト:

```bash
cd scraper
python db_client.py
```

成功すると以下のように表示されます:
```
Supabase接続完了
データベース接続テスト: OK
```

### 5. データ保存テスト

```bash
python main.py
```

成功すると以下のように表示されます:
```
[2/2] データベースに保存中...
✓ 12件をデータベースに保存しました
```

## トラブルシューティング

### Invalid API key エラー

**原因**: API keyが正しくない、または古い形式

**解決方法**:
1. Supabaseダッシュボードで最新の「anon public」キーを取得
2. `.env` ファイルを更新
3. Pythonスクリプトを再実行

### テーブルが存在しないエラー

**原因**: `price_history` テーブルが作成されていない

**解決方法**:
1. `setup_database.sql` をSupabase SQL Editorで実行
2. テーブルが作成されたことを確認

### 環境変数が読み込まれない

**原因**: `.env` ファイルのエンコーディングまたは改行コードの問題

**解決方法**:
```bash
# PowerShellで正しく作成
@"
SUPABASE_URL=https://sudycxugnvprrrrlkdmm.supabase.co
SUPABASE_KEY=（ここに正しいキーを貼り付け）
"@ | Out-File -FilePath .env -Encoding UTF8 -NoNewline
```

## 確認コマンド

### .envファイルの内容確認
```bash
cat .env
```

### Supabase接続テスト
```bash
python db_client.py
```

### 価格データ取得＋保存
```bash
python main.py
```

### 保存されたデータの確認
Supabaseダッシュボード → Table Editor → price_history
