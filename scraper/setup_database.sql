-- ResaleTracker - Supabase Database Setup
-- このSQLをSupabase SQL Editorで実行してください

-- price_historyテーブルを作成
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  storage TEXT NOT NULL,
  price INTEGER NOT NULL,
  color_note TEXT,
  captured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- インデックスを作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_price_history_model 
  ON price_history(model_name);

CREATE INDEX IF NOT EXISTS idx_price_history_captured_at 
  ON price_history(captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_model_storage 
  ON price_history(model_name, storage);

-- コメントを追加
COMMENT ON TABLE price_history IS 'iPhone買取価格の履歴データ';
COMMENT ON COLUMN price_history.model_name IS '機種名（例: iPhone 17 Pro Max）';
COMMENT ON COLUMN price_history.storage IS '容量（例: 256GB）';
COMMENT ON COLUMN price_history.price IS '買取価格（円）';
COMMENT ON COLUMN price_history.color_note IS '色・備考（オプション）';
COMMENT ON COLUMN price_history.captured_at IS 'スクリーンショット取得日時';
COMMENT ON COLUMN price_history.created_at IS 'レコード作成日時';

-- テーブルが正しく作成されたか確認
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'price_history'
ORDER BY ordinal_position;
