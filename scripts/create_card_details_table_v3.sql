-- Create card_details table to securely store user card information
CREATE TABLE IF NOT EXISTS card_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_no VARCHAR NOT NULL REFERENCES users(account_no) ON DELETE CASCADE,
  card_holder_name VARCHAR NOT NULL,
  card_number_last_four VARCHAR(4) NOT NULL,
  card_brand VARCHAR(50),
  expiry_month INTEGER,
  expiry_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_default BOOLEAN DEFAULT FALSE,
  UNIQUE(account_no, card_number_last_four)
);

-- Enable RLS
ALTER TABLE card_details ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own card details
CREATE POLICY "Users can view own card details" ON card_details
  FOR SELECT USING (
    account_no IN (
      SELECT account_no FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can insert their own card details
CREATE POLICY "Users can insert own card details" ON card_details
  FOR INSERT WITH CHECK (
    account_no IN (
      SELECT account_no FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own card details
CREATE POLICY "Users can update own card details" ON card_details
  FOR UPDATE USING (
    account_no IN (
      SELECT account_no FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can delete their own card details
CREATE POLICY "Users can delete own card details" ON card_details
  FOR DELETE USING (
    account_no IN (
      SELECT account_no FROM users WHERE id = auth.uid()
    )
  );

-- Create indexes for faster lookups
CREATE INDEX idx_card_details_account_no ON card_details(account_no);
CREATE INDEX idx_card_details_card_number ON card_details(card_number_last_four);
