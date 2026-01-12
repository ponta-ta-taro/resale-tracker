-- シリアル番号カラムを削除するマイグレーション
-- このカラムは不要なため削除

ALTER TABLE inventory DROP COLUMN IF EXISTS serial_number;
