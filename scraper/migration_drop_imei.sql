-- IMEIカラムを削除するマイグレーション
-- このカラムは事前に調べることができないため不要

ALTER TABLE inventory DROP COLUMN IF EXISTS imei;
