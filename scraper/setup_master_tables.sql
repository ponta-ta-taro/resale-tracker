-- ============================================
-- シンプルなカラム追加SQL
-- 実行順序: このファイルを上から順に実行
-- ============================================

-- ============================================
-- 1. payment_methodsにlast_used_atを追加
-- ============================================
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- ============================================
-- 2. inventoryテーブルにカラムを追加
-- ============================================

-- 支払い方法（外部キー）
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

-- 購入Apple ID（シンプルなテキスト）
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS apple_id_used TEXT;

-- ============================================
-- 3. インデックス作成
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventory_payment_method_id ON inventory(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_inventory_apple_id_used ON inventory(apple_id_used);
