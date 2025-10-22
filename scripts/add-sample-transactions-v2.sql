-- Add sample transactions for testing
INSERT INTO public.transactions (
  user_id,
  type,
  amount,
  description,
  status,
  reference,
  created_at
) 
SELECT 
  (SELECT id FROM public."user" LIMIT 1) as user_id,
  type,
  amount,
  description,
  'completed' as status,
  'TXN-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 6, '0'),
  NOW() - (ROW_NUMBER() OVER ())::interval * '1 day'
FROM (
  VALUES 
    ('debit', 50000, 'Electricity Payment'),
    ('credit', 25000, 'Salary Deposit'),
    ('debit', 15000, 'Internet Subscription'),
    ('debit', 5000, 'Shopping'),
    ('credit', 100000, 'Freelance Income'),
    ('debit', 8000, 'Food & Dining'),
    ('debit', 12000, 'Gas Station'),
    ('credit', 50000, 'Transfer from Friend'),
    ('debit', 3000, 'Phone Top-up'),
    ('debit', 20000, 'Utilities')
) AS t(type, amount, description)
ON CONFLICT DO NOTHING;

-- Add realistic sample transactions for testing
DO $$
DECLARE
    user_record RECORD;
    merchants TEXT[] := ARRAY[
        'Walmart Supercenter', 'Amazon.com', 'Starbucks Coffee', 'Shell Gas Station', 
        'McDonald''s Restaurant', 'Target Store', 'CVS Pharmacy', 'Home Depot',
        'Uber Technologies', 'Netflix Subscription', 'Spotify Premium', 'Electric Company',
        'Water Utility', 'Internet Provider', 'Mobile Phone Bill', 'Insurance Payment',
        'Grocery Store', 'Restaurant Dining', 'Coffee Shop', 'Gas Station'
    ];
    sender_names TEXT[] := ARRAY[
        'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
        'Jessica Miller', 'Christopher Taylor', 'Amanda Anderson', 'Matthew Thomas', 'Ashley Jackson'
    ];
    i INTEGER;
    random_amount DECIMAL(10,2);
    random_date TIMESTAMP;
    transaction_ref TEXT;
    random_merchant TEXT;
    random_sender TEXT;
BEGIN
    -- Loop through each user and add sample transactions
    FOR user_record IN 
        SELECT id, account_no, first_name, last_name 
        FROM public.users 
        WHERE account_no IS NOT NULL 
        LIMIT 10
    LOOP
        -- Add 15-20 transactions per user
        FOR i IN 1..20 LOOP
            -- Generate random transaction data
            random_date := NOW() - (RANDOM() * INTERVAL '90 days');
            transaction_ref := 'TXN' || TO_CHAR(random_date, 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
            random_merchant := merchants[1 + FLOOR(RANDOM() * array_length(merchants, 1))];
            random_sender := sender_names[1 + FLOOR(RANDOM() * array_length(sender_names, 1))];
            
            -- Generate different types of transactions with realistic amounts
            CASE (FLOOR(RANDOM() * 5) + 1)::INTEGER
                WHEN 1 THEN -- Deposit
                    random_amount := 500 + (RANDOM() * 4500);
                    INSERT INTO public.transactions (
                        account_no, amount, transaction_type, status, reference, 
                        narration, created_at, updated_at,
                        recipient_account_number, recipient_name
                    ) VALUES (
                        user_record.account_no, random_amount, 'deposit', 'completed', transaction_ref,
                        CASE 
                            WHEN random_amount > 2000 THEN 'Salary Payment'
                            WHEN random_amount > 1000 THEN 'Bonus Payment'
                            ELSE 'Deposit - ' || random_merchant
                        END,
                        random_date, random_date,
                        user_record.account_no, user_record.first_name || ' ' || user_record.last_name
                    );
                    
                WHEN 2 THEN -- Withdrawal
                    random_amount := 20 + (RANDOM() * 480);
                    INSERT INTO public.transactions (
                        account_no, amount, transaction_type, status, reference,
                        narration, created_at, updated_at,
                        sender_account_number, sender_name
                    ) VALUES (
                        user_record.account_no, random_amount, 'withdrawal', 'completed', transaction_ref,
                        'ATM Withdrawal - ' || random_merchant,
                        random_date, random_date,
                        user_record.account_no, user_record.first_name || ' ' || user_record.last_name
                    );
                    
                WHEN 3 THEN -- Transfer In
                    random_amount := 25 + (RANDOM() * 975);
                    INSERT INTO public.transactions (
                        account_no, amount, transaction_type, status, reference,
                        narration, created_at, updated_at,
                        sender_account_number, sender_name,
                        recipient_account_number, recipient_name
                    ) VALUES (
                        user_record.account_no, random_amount, 'transfer_in', 'completed', transaction_ref,
                        'Transfer from ' || random_sender,
                        random_date, random_date,
                        '1000000' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'), random_sender,
                        user_record.account_no, user_record.first_name || ' ' || user_record.last_name
                    );
                    
                WHEN 4 THEN -- Transfer Out
                    random_amount := 30 + (RANDOM() * 970);
                    INSERT INTO public.transactions (
                        account_no, amount, transaction_type, status, reference,
                        narration, created_at, updated_at,
                        sender_account_number, sender_name,
                        recipient_account_number, recipient_name
                    ) VALUES (
                        user_record.account_no, random_amount, 'transfer_out', 'completed', transaction_ref,
                        'Transfer to ' || random_sender,
                        random_date, random_date,
                        user_record.account_no, user_record.first_name || ' ' || user_record.last_name,
                        '1000000' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'), random_sender
                    );
                    
                WHEN 5 THEN -- Payment
                    random_amount := 15 + (RANDOM() * 485);
                    INSERT INTO public.transactions (
                        account_no, amount, transaction_type, status, reference,
                        narration, created_at, updated_at,
                        sender_account_number, sender_name
                    ) VALUES (
                        user_record.account_no, random_amount, 'withdrawal', 'completed', transaction_ref,
                        'Payment - ' || random_merchant,
                        random_date, random_date,
                        user_record.account_no, user_record.first_name || ' ' || user_record.last_name
                    );
            END CASE;
        END LOOP;
    END LOOP;
END $$;

-- Update account balances based on transactions
UPDATE public.users 
SET account_balance = (
    SELECT COALESCE(
        (SELECT SUM(amount) FROM public.transactions 
         WHERE account_no = public.users.account_no 
         AND transaction_type IN ('deposit', 'transfer_in', 'loan_disbursement')
         AND status = 'completed') 
        - 
        (SELECT SUM(amount) FROM public.transactions 
         WHERE account_no = public.users.account_no 
         AND transaction_type IN ('withdrawal', 'transfer_out', 'loan_repayment')
         AND status = 'completed'),
        1000.00
    )
)
WHERE account_no IS NOT NULL;

-- Ensure no negative balances
UPDATE public.users 
SET account_balance = 100.00 
WHERE account_balance < 100.00 AND account_no IS NOT NULL;
