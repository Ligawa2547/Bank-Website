-- Create function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(
  user_account_no TEXT,
  amount_change DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    balance = COALESCE(balance, 0) + amount_change,
    updated_at = NOW()
  WHERE account_no = user_account_no;
  
  -- Check if user was found and updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with account number % not found', user_account_no;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_balance(TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_balance(TEXT, DECIMAL) TO service_role;
