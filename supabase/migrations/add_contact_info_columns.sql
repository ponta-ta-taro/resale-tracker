-- Add contact_email and contact_phone TEXT columns to inventory table
-- These will store direct text values for quick access without JOINs

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS contact_email TEXT;

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_contact_email ON inventory(contact_email);
CREATE INDEX IF NOT EXISTS idx_inventory_contact_phone ON inventory(contact_phone);

-- Add comments
COMMENT ON COLUMN inventory.contact_email IS '連絡先メールアドレス（転送元メールから自動設定）';
COMMENT ON COLUMN inventory.contact_phone IS '連絡先電話番号（contact_emailsテーブルから自動取得）';
