-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('gift_card', 'credit_card_points')),
  description TEXT NOT NULL,
  amount INTEGER,
  points INTEGER,
  point_rate DECIMAL(10, 2),
  earned_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rewards
CREATE POLICY "Users can view their own rewards"
  ON rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
  ON rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
  ON rewards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rewards"
  ON rewards FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_earned_at ON rewards(earned_at);
CREATE INDEX IF NOT EXISTS idx_rewards_inventory_id ON rewards(inventory_id);
