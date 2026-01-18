-- Add order_token column to inventory table
-- This stores the Apple guest order access token extracted from confirmation emails

ALTER TABLE inventory
ADD COLUMN order_token TEXT;

COMMENT ON COLUMN inventory.order_token IS 'Apple guest order access token extracted from confirmation email links';
