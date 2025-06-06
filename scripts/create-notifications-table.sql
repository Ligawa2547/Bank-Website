-- Check if the notifications table exists
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to create transaction notifications
CREATE OR REPLACE FUNCTION create_transaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Set notification title and message based on transaction type
  CASE NEW.transaction_type
    WHEN 'deposit' THEN
      notification_title := 'Deposit Received';
      notification_message := 'You received a deposit of $' || NEW.amount::TEXT || '.';
    WHEN 'withdrawal' THEN
      notification_title := 'Withdrawal Completed';
      notification_message := 'Your withdrawal of $' || NEW.amount::TEXT || ' has been processed.';
    WHEN 'transfer_in' THEN
      notification_title := 'Transfer Received';
      notification_message := 'You received $' || NEW.amount::TEXT || ' from ' || COALESCE(NEW.sender_name, 'another user') || '.';
    WHEN 'transfer_out' THEN
      notification_title := 'Transfer Sent';
      notification_message := 'Your transfer of $' || NEW.amount::TEXT || ' to ' || COALESCE(NEW.recipient_name, 'another user') || ' was successful.';
    ELSE
      notification_title := 'Transaction Update';
      notification_message := 'A transaction of $' || NEW.amount::TEXT || ' has been processed.';
  END CASE;
  
  -- Only create notification for completed transactions
  IF NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.user_id, notification_title, notification_message);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new transactions
DROP TRIGGER IF EXISTS transaction_notification_trigger ON public.transactions;
CREATE TRIGGER transaction_notification_trigger
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_notification();

-- Create trigger for updated transactions (when status changes to completed)
DROP TRIGGER IF EXISTS transaction_update_notification_trigger ON public.transactions;
CREATE TRIGGER transaction_update_notification_trigger
  AFTER UPDATE OF status ON public.transactions
  FOR EACH ROW
  WHEN (OLD.status <> 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION create_transaction_notification();

-- Create function to create loan notifications
CREATE OR REPLACE FUNCTION create_loan_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Set notification title and message based on loan status
  CASE NEW.status
    WHEN 'approved' THEN
      notification_title := 'Loan Approved';
      notification_message := 'Your loan application for $' || NEW.requested_amount::TEXT || ' has been approved.';
    WHEN 'rejected' THEN
      notification_title := 'Loan Application Update';
      notification_message := 'Your loan application for $' || NEW.requested_amount::TEXT || ' was not approved.';
    WHEN 'disbursed' THEN
      notification_title := 'Loan Disbursed';
      notification_message := 'Your approved loan of $' || COALESCE(NEW.approved_amount, NEW.requested_amount)::TEXT || ' has been disbursed to your account.';
    ELSE
      -- Don't create notifications for other statuses
      RETURN NEW;
  END CASE;
  
  -- Create the notification
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (NEW.user_id, notification_title, notification_message);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loan status changes
DROP TRIGGER IF EXISTS loan_notification_trigger ON public.loan_applications;
CREATE TRIGGER loan_notification_trigger
  AFTER UPDATE OF status ON public.loan_applications
  FOR EACH ROW
  WHEN (OLD.status <> NEW.status)
  EXECUTE FUNCTION create_loan_notification();
