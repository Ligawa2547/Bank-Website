-- First, add the account_no column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'account_no') THEN
        ALTER TABLE notifications ADD COLUMN account_no TEXT;
    END IF;
END $$;

-- Update existing notifications to include account numbers
-- This will set account_no based on the user_id by looking up their account number
UPDATE notifications 
SET account_no = (
    SELECT account_number 
    FROM users 
    WHERE users.user_id::text = notifications.user_id::text
    LIMIT 1
)
WHERE account_no IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_account_no ON notifications(account_no);
CREATE INDEX IF NOT EXISTS idx_notifications_user_account ON notifications(user_id, account_no);

-- Update RLS policies to use account_no
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Create new RLS policies that filter by account number
CREATE POLICY "Users can view notifications for their account" ON notifications
    FOR SELECT USING (
        account_no IN (
            SELECT account_number 
            FROM users 
            WHERE users.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update notifications for their account" ON notifications
    FOR UPDATE USING (
        account_no IN (
            SELECT account_number 
            FROM users 
            WHERE users.user_id = auth.uid()
        )
    );

-- Function to create transaction notifications
CREATE OR REPLACE FUNCTION create_transaction_notification(
    p_account_no TEXT,
    p_transaction_type TEXT,
    p_amount DECIMAL,
    p_reference TEXT,
    p_counterparty TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_user_id UUID;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Get user_id from account number
    SELECT user_id INTO v_user_id
    FROM users
    WHERE account_number = p_account_no
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Create appropriate notification based on transaction type
    CASE p_transaction_type
        WHEN 'deposit' THEN
            v_title := 'Deposit Received';
            v_message := 'You received a deposit of $' || p_amount || '. Reference: ' || p_reference;
        WHEN 'withdrawal' THEN
            v_title := 'Withdrawal Processed';
            v_message := 'You withdrew $' || p_amount || '. Reference: ' || p_reference;
        WHEN 'transfer_in' THEN
            v_title := 'Transfer Received';
            v_message := 'You received $' || p_amount || ' from ' || COALESCE(p_counterparty, 'Unknown') || '. Reference: ' || p_reference;
        WHEN 'transfer_out' THEN
            v_title := 'Transfer Sent';
            v_message := 'You sent $' || p_amount || ' to ' || COALESCE(p_counterparty, 'Unknown') || '. Reference: ' || p_reference;
        WHEN 'loan_disbursement' THEN
            v_title := 'Loan Disbursed';
            v_message := 'Your loan of $' || p_amount || ' has been disbursed. Reference: ' || p_reference;
        WHEN 'loan_repayment' THEN
            v_title := 'Loan Payment';
            v_message := 'Loan payment of $' || p_amount || ' processed. Reference: ' || p_reference;
        ELSE
            v_title := 'Transaction Processed';
            v_message := 'Transaction of $' || p_amount || ' processed. Reference: ' || p_reference;
    END CASE;

    -- Insert notification
    INSERT INTO notifications (user_id, account_no, title, message, is_read, created_at)
    VALUES (v_user_id, p_account_no, v_title, v_message, false, NOW());

EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to create notification: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to create loan notifications
CREATE OR REPLACE FUNCTION create_loan_notification(
    p_account_no TEXT,
    p_loan_status TEXT,
    p_amount DECIMAL,
    p_loan_type TEXT DEFAULT 'Personal Loan'
)
RETURNS void AS $$
DECLARE
    v_user_id UUID;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Get user_id from account number
    SELECT user_id INTO v_user_id
    FROM users
    WHERE account_number = p_account_no
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Create appropriate notification based on loan status
    CASE p_loan_status
        WHEN 'approved' THEN
            v_title := 'Loan Approved';
            v_message := 'Your ' || p_loan_type || ' application for $' || p_amount || ' has been approved!';
        WHEN 'rejected' THEN
            v_title := 'Loan Application Update';
            v_message := 'Your ' || p_loan_type || ' application for $' || p_amount || ' requires additional review.';
        WHEN 'disbursed' THEN
            v_title := 'Loan Disbursed';
            v_message := 'Your ' || p_loan_type || ' of $' || p_amount || ' has been disbursed to your account.';
        WHEN 'completed' THEN
            v_title := 'Loan Completed';
            v_message := 'Congratulations! Your ' || p_loan_type || ' has been fully repaid.';
        ELSE
            v_title := 'Loan Update';
            v_message := 'Your ' || p_loan_type || ' status has been updated.';
    END CASE;

    -- Insert notification
    INSERT INTO notifications (user_id, account_no, title, message, is_read, created_at)
    VALUES (v_user_id, p_account_no, v_title, v_message, false, NOW());

EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to create loan notification: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create welcome notifications for existing users who don't have any
INSERT INTO notifications (user_id, account_no, title, message, is_read, created_at)
SELECT 
    u.user_id,
    u.account_number,
    'Welcome to IAE Bank',
    'Welcome to your digital banking experience! Your account ' || u.account_number || ' is ready to use.',
    false,
    NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n 
    WHERE n.user_id = u.user_id
);

-- Create triggers for automatic transaction notifications
CREATE OR REPLACE FUNCTION notify_transaction_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify sender for outgoing transfers
    IF NEW.sender_account_number IS NOT NULL THEN
        PERFORM create_transaction_notification(
            NEW.sender_account_number,
            'transfer_out',
            NEW.amount,
            NEW.reference,
            COALESCE(NEW.recipient_name, NEW.recipient_account_number)
        );
    END IF;

    -- Notify recipient for incoming transfers
    IF NEW.recipient_account_number IS NOT NULL THEN
        PERFORM create_transaction_notification(
            NEW.recipient_account_number,
            'transfer_in',
            NEW.amount,
            NEW.reference,
            COALESCE(NEW.sender_name, NEW.sender_account_number)
        );
    END IF;

    -- Notify for other transaction types
    IF NEW.account_no IS NOT NULL AND NEW.sender_account_number IS NULL AND NEW.recipient_account_number IS NULL THEN
        PERFORM create_transaction_notification(
            NEW.account_no,
            NEW.transaction_type,
            NEW.amount,
            NEW.reference
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS transaction_notification_trigger ON transactions;
CREATE TRIGGER transaction_notification_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION notify_transaction_trigger();

-- Create trigger for loan notifications
CREATE OR REPLACE FUNCTION notify_loan_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_account_no TEXT;
BEGIN
    -- Get account number from user_id
    SELECT account_number INTO v_account_no
    FROM users
    WHERE user_id::text = NEW.user_id::text
    LIMIT 1;

    IF v_account_no IS NOT NULL THEN
        PERFORM create_loan_notification(
            v_account_no,
            NEW.status,
            COALESCE(NEW.approved_amount, NEW.requested_amount),
            COALESCE((SELECT name FROM loan_types WHERE id = NEW.loan_type_id), 'Personal Loan')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create loan trigger if it doesn't exist
DROP TRIGGER IF EXISTS loan_notification_trigger ON loan_applications;
CREATE TRIGGER loan_notification_trigger
    AFTER UPDATE ON loan_applications
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_loan_trigger();
