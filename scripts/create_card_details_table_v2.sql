-- Create card_details table to securely store user card information
CREATE TABLE IF NOT EXISTS card_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_no VARCHAR NOT NULL,
  card_holder_name VARCHAR NOT NULL,
  card_number_last_four VARCHAR(4) NOT NULL,
  card_brand VARCHAR(50), -- visa, mastercard, amex, etc
  expiry_month INTEGER,
  expiry_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_default BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, card_number_last_four)
);

-- Enable RLS
ALTER TABLE card_details ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own card details
CREATE POLICY "Users can view own card details" ON card_details
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- RLS Policy: Users can insert their own card details
CREATE POLICY "Users can insert own card details" ON card_details
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- RLS Policy: Users can update their own card details
CREATE POLICY "Users can update own card details" ON card_details
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- RLS Policy: Users can delete their own card details
CREATE POLICY "Users can delete own card details" ON card_details
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_card_details_user_id ON card_details(user_id);
CREATE INDEX idx_card_details_account_no ON card_details(account_no);
