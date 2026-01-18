-- Add carrier column to inventory table for tracking shipments
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS carrier TEXT;

COMMENT ON COLUMN inventory.carrier IS 'Shipping carrier code: japan_post, yamato, sagawa';
