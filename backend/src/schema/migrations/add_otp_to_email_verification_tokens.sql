-- Migration: Add OTP column to email_verification_tokens table

ALTER TABLE email_verification_tokens
ADD COLUMN otp VARCHAR(10);

ALTER TABLE email_verification_tokens
DROP COLUMN IF EXISTS token;
 