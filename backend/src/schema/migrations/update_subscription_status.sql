-- Drop the old check constraint if it exists
ALTER TABLE users
DROP CONSTRAINT IF EXISTS subscription_status_check;

-- Alter the column to match new enum values
ALTER TABLE users
ALTER COLUMN subscription_status TYPE VARCHAR(50) USING subscription_status::VARCHAR,
ALTER COLUMN subscription_status SET DEFAULT 'free';

-- Add new check constraint
ALTER TABLE users
ADD CONSTRAINT subscription_status_check
CHECK (subscription_status IN ('free', 'basic_premium', 'pro_premium', 'trial'));
