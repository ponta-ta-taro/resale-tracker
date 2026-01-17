-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('order', 'shipping', 'delivery', 'invoice', 'unknown')),
  process_result TEXT NOT NULL CHECK (process_result IN ('success', 'skipped', 'error')),
  notes TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_logs
CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email logs"
  ON email_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email logs"
  ON email_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email logs"
  ON email_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_received_at ON email_logs(received_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_inventory_id ON email_logs(inventory_id);
