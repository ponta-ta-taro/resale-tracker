-- 連絡先メールアドレス
CREATE TABLE contact_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contact_emails" ON contact_emails FOR ALL USING (auth.uid() = user_id);

-- 連絡先電話番号
CREATE TABLE contact_phones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contact_phones" ON contact_phones FOR ALL USING (auth.uid() = user_id);

-- クレジットカード
CREATE TABLE credit_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own credit_cards" ON credit_cards FOR ALL USING (auth.uid() = user_id);

-- inventoryテーブルにカラム追加
ALTER TABLE inventory ADD COLUMN contact_email_id UUID REFERENCES contact_emails(id);
ALTER TABLE inventory ADD COLUMN contact_phone_id UUID REFERENCES contact_phones(id);
ALTER TABLE inventory ADD COLUMN credit_card_id UUID REFERENCES credit_cards(id);
ALTER TABLE inventory ADD COLUMN apple_account TEXT;
