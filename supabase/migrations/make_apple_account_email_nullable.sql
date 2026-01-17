-- Make email column nullable in apple_accounts table
ALTER TABLE apple_accounts 
ALTER COLUMN email DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN apple_accounts.email IS 'Email address (optional - can be null for guest accounts)';
