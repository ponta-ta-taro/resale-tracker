-- ResaleTracker - Add source column to price_history
-- このSQLをSupabase SQL Editorで実行してください

-- Step 1: sourceカラムを追加
ALTER TABLE price_history 
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'mobile_mix';

-- Step 2: 既存データに'mobile_mix'を設定（念のため）
UPDATE price_history 
SET source = 'mobile_mix' 
WHERE source IS NULL OR source = '';

-- Step 3: インデックスを作成
CREATE INDEX IF NOT EXISTS idx_price_history_source 
  ON price_history(source);

CREATE INDEX IF NOT EXISTS idx_price_history_source_model 
  ON price_history(source, model_name, storage);

-- Step 4: コメントを追加
COMMENT ON COLUMN price_history.source IS '業者名（mobile_mix, iosys, netoff, janpara）';

-- Step 5: テーブル構造を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'price_history'
ORDER BY ordinal_position;
