-- Add account_no column to notifications table if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS account_no VARCHAR(20);

-- Update existing notifications to include account_no from users table
-- Fix the type casting issue by converting UUID to text
UPDATE public.notifications 
SET account_no = users.account_number
FROM public.users 
WHERE notifications.user_id::text = users.id::text 
AND notifications.account_no IS NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view notifications for their account" ON public.notifications;
DROP POLICY IF EXISTS "Users can update notifications for their account" ON public.notifications;

-- Policy for users to view notifications for their account number
CREATE POLICY "Users can view notifications for their account" 
  ON public.notifications 
  FOR SELECT 
  USING (
    account_no IN (
      SELECT account_number FROM public.users WHERE id::text = auth.uid()::text
    )
  );

-- Policy for users to update notifications for their account number
CREATE POLICY "Users can update notifications for their account" 
  ON public.notifications 
  FOR UPDATE 
  USING (
    account_no IN (
      SELECT account_number FROM public.users WHERE id::text = auth.uid()::text
    )
  );

-- Update the transaction notification function to include account_no
CREATE OR REPLACE FUNCTION create_transaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  user_account_no TEXT;
BEGIN
  -- Get the user's account number with proper type casting
  SELECT account_number INTO user_account_no 
  FROM public.users 
  WHERE id::text = NEW.user_id::text;

  -- Set notification title and message based on transaction type
  CASE NEW.transaction_type
    WHEN 'deposit' THEN
      notification_title := 'Deposit Received';
      notification_message := 'You received a deposit of $' || NEW.amount::TEXT || ' to your account ' || user_account_no || '.';
    WHEN 'withdrawal' THEN
      notification_title := 'Withdrawal Completed';
      notification_message := 'Your withdrawal of $' || NEW.amount::TEXT || ' from account ' || user_account_no || ' has been processed.';
    WHEN 'transfer_in' THEN
      notification_title := 'Transfer Received';
      notification_message := 'You received $' || NEW.amount::TEXT || ' from ' || COALESCE(NEW.sender_name, 'another user') || ' to account ' || user_account_no || '.';
    WHEN 'transfer_out' THEN
      notification_title := 'Transfer Sent';
      notification_message := 'Your transfer of $' || NEW.amount::TEXT || ' to ' || COALESCE(NEW.recipient_name, 'another user') || ' from account ' || user_account_no || ' was successful.';
    WHEN 'loan_disbursement' THEN
      notification_title := 'Loan Disbursed';
      notification_message := 'Your loan of $' || NEW.amount::TEXT || ' has been disbursed to account ' || user_account_no || '.';
    WHEN 'loan_repayment' THEN
      notification_title := 'Loan Payment';
      notification_message := 'Your loan payment of $' || NEW.amount::TEXT || ' has been processed for account ' || user_account_no || '.';
    ELSE
      notification_title := 'Transaction Update';
      notification_message := 'A transaction of $' || NEW.amount::TEXT || ' has been processed on account ' || user_account_no || '.';
  END CASE;
  
  -- Only create notification for completed transactions
  IF NEW.status = 'completed' AND user_account_no IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, account_no, title, message)
    VALUES (NEW.user_id, user_account_no, notification_title, notification_message);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger for transaction notifications
DROP TRIGGER IF EXISTS transaction_notification_trigger ON public.transactions;
CREATE TRIGGER transaction_notification_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_notification();

-- Update the loan notification function to include account_no
CREATE OR REPLACE FUNCTION create_loan_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  user_account_no TEXT;
BEGIN
  -- Get the user's account number with proper type casting
  SELECT account_number INTO user_account_no 
  FROM public.users 
  WHERE id::text = NEW.user_id::text;

  -- Set notification title and message based on loan status
  CASE NEW.status
    WHEN 'approved' THEN
      notification_title := 'Loan Approved';
      notification_message := 'Your loan application for $' || NEW.requested_amount::TEXT || ' has been approved for account ' || user_account_no || '.';
    WHEN 'rejected' THEN
      notification_title := 'Loan Application Update';
      notification_message := 'Your loan application for $' || NEW.requested_amount::TEXT || ' was not approved for account ' || user_account_no || '. Please contact support for more information.';
    WHEN 'disbursed' THEN
      notification_title := 'Loan Disbursed';
      notification_message := 'Your approved loan of $' || COALESCE(NEW.approved_amount, NEW.requested_amount)::TEXT || ' has been disbursed to account ' || user_account_no || '.';
    ELSE
      -- Don't create notifications for other statuses
      RETURN NEW;
  END CASE;
  
  -- Create the notification if account number exists
  IF user_account_no IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, account_no, title, message)
    VALUES (NEW.user_id, user_account_no, notification_title, notification_message);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger for loan notifications
DROP TRIGGER IF EXISTS loan_notification_trigger ON public.loan_applications;
CREATE TRIGGER loan_notification_trigger
  AFTER UPDATE ON public.loan_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION create_loan_notification();

-- Create function for transfer notifications (for both sender and recipient)
CREATE OR REPLACE FUNCTION create_transfer_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_account_no TEXT;
  recipient_account_no TEXT;
  sender_user_id UUID;
  recipient_user_id UUID;
BEGIN
  -- Only process completed transfers
  IF NEW.status = 'completed' AND NEW.transaction_type IN ('transfer_in', 'transfer_out') THEN
    
    -- For transfer_out (sender notification)
    IF NEW.transaction_type = 'transfer_out' THEN
      -- Get sender's account info
      SELECT account_number, id INTO sender_account_no, sender_user_id
      FROM public.users 
      WHERE id::text = NEW.user_id::text;
      
      IF sender_account_no IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, account_no, title, message)
        VALUES (
          sender_user_id, 
          sender_account_no, 
          'Transfer Sent',
          'Your transfer of $' || NEW.amount::TEXT || ' to ' || COALESCE(NEW.recipient_name, NEW.recipient_account_number) || ' was successful.'
        );
      END IF;
    END IF;
    
    -- For transfer_in (recipient notification)
    IF NEW.transaction_type = 'transfer_in' AND NEW.recipient_account_number IS NOT NULL THEN
      -- Get recipient's account info
      SELECT account_number, id INTO recipient_account_no, recipient_user_id
      FROM public.users 
      WHERE account_number = NEW.recipient_account_number;
      
      IF recipient_account_no IS NOT NULL AND recipient_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, account_no, title, message)
        VALUES (
          recipient_user_id, 
          recipient_account_no, 
          'Transfer Received',
          'You received $' || NEW.amount::TEXT || ' from ' || COALESCE(NEW.sender_name, NEW.sender_account_number) || '.'
        );
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger for transfer notifications
DROP TRIGGER IF EXISTS transfer_notification_trigger ON public.transactions;
CREATE TRIGGER transfer_notification_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  WHEN (NEW.transaction_type IN ('transfer_in', 'transfer_out'))
  EXECUTE FUNCTION create_transfer_notification();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_account_no ON public.notifications(account_no);
CREATE INDEX IF NOT EXISTS idx_notifications_user_account ON public.notifications(user_id, account_no);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Create a function to manually create a welcome notification for existing users
CREATE OR REPLACE FUNCTION create_welcome_notifications()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Create welcome notifications for users who don't have any notifications yet
  FOR user_record IN 
    SELECT u.id, u.account_number, u.first_name
    FROM public.users u
    LEFT JOIN public.notifications n ON n.user_id = u.id
    WHERE n.id IS NULL AND u.account_number IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, account_no, title, message)
    VALUES (
      user_record.id,
      user_record.account_number,
      'Welcome to IAE Banking!',
      'Welcome ' || user_record.first_name || '! Your account ' || user_record.account_number || ' is now active. You can start making transactions and managing your finances.'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the welcome notification function
SELECT create_welcome_notifications();

-- Drop the temporary function
DROP FUNCTION create_welcome_notifications();

-- Add some sample notifications for testing (optional)
-- Uncomment the following lines if you want to add test notifications

/*
INSERT INTO public.notifications (user_id, account_no, title, message)
SELECT 
  u.id,
  u.account_number,
  'Account Security Update',
  'Your account ' || u.account_number || ' security settings have been updated. If this wasn''t you, please contact support immediately.'
FROM public.users u
WHERE u.account_number IS NOT NULL
LIMIT 5;
*/

-- Verify the setup
DO $$
DECLARE
  notification_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO notification_count FROM public.notifications;
  SELECT COUNT(*) INTO user_count FROM public.users WHERE account_number IS NOT NULL;
  
  RAISE NOTICE 'Setup complete! Created % notifications for % users with account numbers.', notification_count, user_count;
END $$;
