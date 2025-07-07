-- Add realistic sample transactions for testing
-- This script adds sample transactions for existing users

DO $$
DECLARE
    user_record RECORD;
    transaction_types TEXT[] := ARRAY['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'loan_repayment'];
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
        FROM users 
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
                WHEN 1 THEN -- Deposit (salary, refund, etc.)
                    random_amount := 500 + (RANDOM() * 4500); -- $500 - $5000
                    INSERT INTO transactions (
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
                    
                WHEN 2 THEN -- Withdrawal (ATM, cash)
                    random_amount := 20 + (RANDOM() * 480); -- $20 - $500
                    INSERT INTO transactions (
                        account_no, amount, transaction_type, status, reference,
                        narration, created_at, updated_at,
                        sender_account_number, sender_name
                    ) VALUES (
                        user_record.account_no, random_amount, 'withdrawal', 'completed', transaction_ref,
                        'ATM Withdrawal - ' || random_merchant,
                        random_date, random_date,
                        user_record.account_no, user_record.first_name || ' ' || user_record.last_name
                    );
                    
                WHEN 3 THEN -- Transfer In (from someone else)
                    random_amount := 25 + (RANDOM() * 975); -- $25 - $1000
                    INSERT INTO transactions (
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
                    
                WHEN 4 THEN -- Transfer Out (to someone else)
                    random_amount := 30 + (RANDOM() * 970); -- $30 - $1000
                    INSERT INTO transactions (
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
                    
                WHEN 5 THEN -- Payment (bills, shopping)
                    random_amount := 15 + (RANDOM() * 485); -- $15 - $500
                    INSERT INTO transactions (
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
        
        RAISE NOTICE 'Added sample transactions for user: % (Account: %)', 
            user_record.first_name || ' ' || user_record.last_name, user_record.account_no;
    END LOOP;
    
    RAISE NOTICE 'Sample transactions added successfully!';
END $$;

-- Update account balances based on transactions
UPDATE users 
SET account_balance = (
    SELECT COALESCE(
        (SELECT SUM(amount) FROM transactions 
         WHERE account_no = users.account_no 
         AND transaction_type IN ('deposit', 'transfer_in', 'loan_disbursement')
         AND status = 'completed') 
        - 
        (SELECT SUM(amount) FROM transactions 
         WHERE account_no = users.account_no 
         AND transaction_type IN ('withdrawal', 'transfer_out', 'loan_repayment')
         AND status = 'completed'),
        1000.00 -- Default balance if no transactions
    )
)
WHERE account_no IS NOT NULL;

-- Ensure no negative balances (set minimum to $100)
UPDATE users 
SET account_balance = 100.00 
WHERE account_balance < 100.00 AND account_no IS NOT NULL;

RAISE NOTICE 'Account balances updated based on transaction history!';
