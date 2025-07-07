-- First, ensure all users have proper account numbers
UPDATE users 
SET account_no = CASE 
  WHEN account_no IS NULL OR account_no = '' THEN 
    '1000' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::text, 6, '0')
  ELSE account_no 
END
WHERE account_no IS NULL OR account_no = '';

-- Set default values for account_balance if NULL
UPDATE users 
SET account_balance = 0.00 
WHERE account_balance IS NULL;

-- Set default values for status if NULL
UPDATE users 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Set default values for kyc_status if NULL
UPDATE users 
SET kyc_status = 'not_submitted' 
WHERE kyc_status IS NULL OR kyc_status = '';

-- Set default values for email_verified if NULL
UPDATE users 
SET email_verified = false 
WHERE email_verified IS NULL;

-- Set default values for phone_verified if NULL
UPDATE users 
SET phone_verified = false 
WHERE phone_verified IS NULL;

-- Create function to sync email verification with Supabase auth
CREATE OR REPLACE FUNCTION sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email_verified based on Supabase auth confirmation
  UPDATE users 
  SET email_verified = COALESCE(
    (SELECT email_confirmed_at IS NOT NULL 
     FROM auth.users 
     WHERE id = NEW.id), 
    false
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync email verification
DROP TRIGGER IF EXISTS sync_email_verification_trigger ON auth.users;
CREATE TRIGGER sync_email_verification_trigger
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_verification();

-- Initial sync of email verification status for existing users
UPDATE users 
SET email_verified = COALESCE(
  (SELECT email_confirmed_at IS NOT NULL 
   FROM auth.users 
   WHERE auth.users.id = users.id), 
  false
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_account_no ON users(account_no);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);

-- Create function to generate account numbers for new users
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate account number if not provided
  IF NEW.account_no IS NULL OR NEW.account_no = '' THEN
    NEW.account_no := '1000' || LPAD(
      (SELECT COALESCE(MAX(CAST(SUBSTRING(account_no FROM 5) AS INTEGER)), 0) + 1
       FROM users 
       WHERE account_no ~ '^1000[0-9]+$')::text, 
      6, '0'
    );
  END IF;
  
  -- Set default values
  NEW.account_balance := COALESCE(NEW.account_balance, 0.00);
  NEW.status := COALESCE(NEW.status, 'active');
  NEW.kyc_status := COALESCE(NEW.kyc_status, 'not_submitted');
  NEW.email_verified := COALESCE(NEW.email_verified, false);
  NEW.phone_verified := COALESCE(NEW.phone_verified, false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user account number generation
DROP TRIGGER IF EXISTS generate_account_number_trigger ON users;
CREATE TRIGGER generate_account_number_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_account_number();

-- Update RLS policies to use account_no for filtering where appropriate
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Ensure all existing users have consistent data
UPDATE users 
SET 
  account_balance = COALESCE(account_balance, 0.00),
  status = COALESCE(NULLIF(status, ''), 'active'),
  kyc_status = COALESCE(NULLIF(kyc_status, ''), 'not_submitted'),
  email_verified = COALESCE(email_verified, false),
  phone_verified = COALESCE(phone_verified, false),
  updated_at = NOW()
WHERE 
  account_balance IS NULL 
  OR status IS NULL 
  OR status = '' 
  OR kyc_status IS NULL 
  OR kyc_status = '' 
  OR email_verified IS NULL 
  OR phone_verified IS NULL;
