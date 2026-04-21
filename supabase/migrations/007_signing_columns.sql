-- Add retention_until to contracts (5-year statutory retention, Civil Code RK)
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ;

-- Add proper OTP expiry column and counters to signatures
ALTER TABLE signatures
  ADD COLUMN IF NOT EXISTS otp_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_attempts    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_attempts  INTEGER DEFAULT 0;
