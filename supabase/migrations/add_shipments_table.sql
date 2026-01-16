-- Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shipping_cost INTEGER NOT NULL,
  shipped_to TEXT NOT NULL,
  carrier TEXT NOT NULL,
  tracking_number TEXT,
  shipped_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipments
CREATE POLICY "Users can view their own shipments"
  ON shipments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shipments"
  ON shipments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipments"
  ON shipments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shipments"
  ON shipments FOR DELETE
  USING (auth.uid() = user_id);

-- Add shipment_id column to inventory table
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_shipment_id ON inventory(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_shipped_at ON shipments(shipped_at);
