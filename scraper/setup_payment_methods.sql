-- 支払い方法マスタテーブル
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                          -- カード名・支払い方法名（例: 楽天カード）
    type TEXT NOT NULL DEFAULT 'credit',         -- credit / debit / cash
    closing_day INTEGER,                         -- 締め日（1-31、現金の場合はNULL）
    payment_day INTEGER,                         -- 支払日（1-31、現金の場合はNULL）
    payment_month_offset INTEGER DEFAULT 1,      -- 締月から何ヶ月後に支払うか（0=当月, 1=翌月）
    credit_limit INTEGER,                        -- 利用限度額（現金・デビットの場合はNULL）
    is_active BOOLEAN DEFAULT true,              -- 有効/無効フラグ
    notes TEXT,                                  -- メモ
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 繰り上げ返済履歴テーブル
CREATE TABLE IF NOT EXISTS early_repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,                     -- 返済額
    repayment_date DATE NOT NULL,                -- 返済日
    target_month TEXT,                           -- 対象月（例: "2026-01"）
    notes TEXT,                                  -- メモ
    created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_early_repayments_payment_method_id ON early_repayments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_early_repayments_repayment_date ON early_repayments(repayment_date);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータ（必要に応じて）
-- INSERT INTO payment_methods (name, type, closing_day, payment_day, payment_month_offset, credit_limit)
-- VALUES 
--     ('楽天カード', 'credit', 25, 27, 1, 500000),
--     ('三井住友Visa', 'credit', 15, 10, 1, 300000),
--     ('現金', 'cash', NULL, NULL, NULL, NULL);
