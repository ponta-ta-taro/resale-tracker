-- ============================================
-- マスタテーブル作成SQL
-- 実行順序: このファイルを上から順に実行
-- ============================================

-- ============================================
-- 1. Apple ID管理テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS apple_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,                         -- Apple IDのメールアドレス
    name TEXT,                                   -- 名義（本名）
    phone_number TEXT,                           -- 登録電話番号
    is_active BOOLEAN DEFAULT true,              -- 有効/無効
    last_used_at TIMESTAMPTZ,                    -- 最終使用日
    order_count INTEGER DEFAULT 0,               -- 累計注文数
    notes TEXT,                                  -- メモ
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. 配送先住所管理テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                          -- 宛名
    postal_code TEXT,                            -- 郵便番号
    address TEXT NOT NULL,                       -- 住所
    address_variant TEXT,                        -- 表記バリエーション
    phone_number TEXT,                           -- 電話番号
    is_active BOOLEAN DEFAULT true,              -- 有効/無効
    last_used_at TIMESTAMPTZ,                    -- 最終使用日
    notes TEXT,                                  -- メモ
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. 携帯回線管理テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS mobile_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                          -- 回線の識別名
    carrier TEXT,                                -- キャリア
    phone_number TEXT,                           -- 電話番号
    is_active BOOLEAN DEFAULT true,              -- 有効/無効
    last_used_at TIMESTAMPTZ,                    -- 最終使用日
    notes TEXT,                                  -- メモ
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. payment_methodsにlast_used_atを追加
-- ============================================
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- ============================================
-- 5. inventoryテーブルに外部キーカラムを追加
-- ============================================
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS apple_account_id UUID REFERENCES apple_accounts(id);

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES shipping_addresses(id);

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS mobile_line_id UUID REFERENCES mobile_lines(id);

-- ============================================
-- 6. インデックス作成
-- ============================================
CREATE INDEX IF NOT EXISTS idx_apple_accounts_is_active ON apple_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_apple_accounts_email ON apple_accounts(email);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_is_active ON shipping_addresses(is_active);

CREATE INDEX IF NOT EXISTS idx_mobile_lines_is_active ON mobile_lines(is_active);

CREATE INDEX IF NOT EXISTS idx_inventory_payment_method_id ON inventory(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_inventory_apple_account_id ON inventory(apple_account_id);
CREATE INDEX IF NOT EXISTS idx_inventory_shipping_address_id ON inventory(shipping_address_id);
CREATE INDEX IF NOT EXISTS idx_inventory_mobile_line_id ON inventory(mobile_line_id);

-- ============================================
-- 7. 更新日時を自動更新するトリガー
-- ============================================
-- トリガー関数（既に存在する場合はスキップ）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- apple_accounts用トリガー
DROP TRIGGER IF EXISTS update_apple_accounts_updated_at ON apple_accounts;
CREATE TRIGGER update_apple_accounts_updated_at
    BEFORE UPDATE ON apple_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- shipping_addresses用トリガー
DROP TRIGGER IF EXISTS update_shipping_addresses_updated_at ON shipping_addresses;
CREATE TRIGGER update_shipping_addresses_updated_at
    BEFORE UPDATE ON shipping_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- mobile_lines用トリガー
DROP TRIGGER IF EXISTS update_mobile_lines_updated_at ON mobile_lines;
CREATE TRIGGER update_mobile_lines_updated_at
    BEFORE UPDATE ON mobile_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
