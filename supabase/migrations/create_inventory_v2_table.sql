-- V2 Inventory Management Table
CREATE TABLE IF NOT EXISTS inventory_v2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 識別情報
    inventory_code TEXT NOT NULL UNIQUE, -- order_number + "-" + item_index
    order_number TEXT NOT NULL,
    item_index INTEGER NOT NULL DEFAULT 1,
    
    -- 基本情報
    model_name TEXT NOT NULL,
    storage TEXT NOT NULL,
    color TEXT,
    purchase_source TEXT,
    payment_method_id UUID REFERENCES payment_methods(id),
    apple_id_used TEXT,
    contact_email_id UUID REFERENCES contact_emails(id),
    
    -- ステータス
    status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN (
        'ordered', 'shipped', 'delivered', 'sent_to_buyer', 
        'buyer_completed', 'paid', 'receipt_received'
    )),
    
    -- 日付情報
    order_date DATE,
    expected_delivery_date DATE,
    original_expected_date DATE,
    delivered_at TIMESTAMP,
    
    -- Apple配送情報
    apple_carrier TEXT,
    apple_tracking_number TEXT,
    
    -- 価格情報
    purchase_price INTEGER,
    expected_price INTEGER,
    actual_price INTEGER,
    
    -- 買取・販売情報
    sold_to TEXT,
    carrier TEXT,
    tracking_number TEXT,
    sent_to_buyer_at TIMESTAMP,
    sold_at TIMESTAMP,
    paid_at TIMESTAMP,
    receipt_received_at TIMESTAMP,
    
    -- その他
    notes TEXT,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE inventory_v2 ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view their own inventory_v2"
    ON inventory_v2 FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory_v2"
    ON inventory_v2 FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory_v2"
    ON inventory_v2 FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory_v2"
    ON inventory_v2 FOR DELETE
    USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX idx_inventory_v2_user_id ON inventory_v2(user_id);
CREATE INDEX idx_inventory_v2_status ON inventory_v2(status);
CREATE INDEX idx_inventory_v2_order_number ON inventory_v2(order_number);
CREATE UNIQUE INDEX idx_inventory_v2_code ON inventory_v2(inventory_code);

-- 更新日時の自動更新
CREATE OR REPLACE FUNCTION update_inventory_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_v2_updated_at
    BEFORE UPDATE ON inventory_v2
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_v2_updated_at();
