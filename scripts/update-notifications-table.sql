-- Add account_no column to notifications table if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS account_no VARCHAR(20);

-- Update existing notifications to include account_no from users table
UPDATE public.notifications 
SET account_no = users.account_no
FROM public.users 
WHERE notifications.user_id = users.id 
AND notifications.account_no IS NULL;

-- Update RLS policies to use account_no
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Policy for users to view notifications for their account number
CREATE POLICY "Users can view notifications for their account" 
  ON public.notifications 
  FOR SELECT 
  USING (
    account_no IN (
      SELECT account_no FROM public.users WHERE id = auth.uid()
    )
  );

-- Policy for users to update notifications for their account number
CREATE POLICY "Users can update notifications for their account" 
  ON public.notifications 
  FOR UPDATE 
  USING (
    account_no IN (
      SELECT account_no FROM public.users WHERE id = auth.uid()
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
  -- Get the user's account number
  SELECT account_no INTO user_account_no 
  FROM public.users 
  WHERE id = NEW.user_id;

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

-- Update the loan notification function to include account_no
CREATE OR REPLACE FUNCTION create_loan_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  user_account_no TEXT;
BEGIN
  -- Get the user's account number
  SELECT account_no INTO user_account_no 
  FROM public.users 
  WHERE id = NEW.user_id;

  -- Set notification title and message based on loan status
  CASE NEW.status
    WHEN 'approved' THEN
      notification_title := 'Loan Approved';
      notification_message := 'Your loan application for $' || NEW.requested_amount::TEXT || ' has been approved for account ' || user_account_no || '.';
    WHEN 'rejected' THEN
      notification_title := 'Loan Application Update';
      notification_message := 'Your loan application for $' || NEW.requested_amount::TEXT || ' was not approved for account ' || user_account_no || '.';
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_account_no ON public.notifications(account_no);
CREATE INDEX IF NOT EXISTS idx_notifications_user_account ON public.notifications(user_id, account_no);
