-- Create a function to handle transfers atomically
CREATE OR REPLACE FUNCTION transfer_funds(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_sender_account TEXT,
  p_recipient_account TEXT,
  p_amount NUMERIC,
  p_narration TEXT,
  p_reference TEXT,
  p_sender_name TEXT,
  p_recipient_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_sender_balance NUMERIC;
  v_result JSONB;
BEGIN
  -- Check if sender has sufficient balance
  SELECT balance INTO v_sender_balance FROM users WHERE id = p_sender_id;
  
  IF v_sender_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sender account not found');
  END IF;
  
  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
  END IF;
  
  -- Begin transaction
  BEGIN
    -- Update sender's balance
    UPDATE users
    SET balance = balance - p_amount
    WHERE id = p_sender_id;
    
    -- Update recipient's balance
    UPDATE users
    SET balance = balance + p_amount
    WHERE id = p_recipient_id;
    
    -- Create outgoing transaction record
    INSERT INTO transactions (
      account_no,
      amount,
      transaction_type,
      status,
      reference,
      narration,
      recipient_account_number,
      recipient_name,
      sender_account_number,
      sender_name
    ) VALUES (
      p_sender_account,
      p_amount,
      'transfer_out',
      'completed',
      p_reference,
      p_narration,
      p_recipient_account,
      p_recipient_name,
      p_sender_account,
      p_sender_name
    );
    
    -- Create incoming transaction record
    INSERT INTO transactions (
      account_no,
      amount,
      transaction_type,
      status,
      reference,
      narration,
      recipient_account_number,
      recipient_name,
      sender_account_number,
      sender_name
    ) VALUES (
      p_recipient_account,
      p_amount,
      'transfer_in',
      'completed',
      p_reference,
      p_narration,
      p_recipient_account,
      p_recipient_name,
      p_sender_account,
      p_sender_name
    );
    
    -- Create notification for sender
    INSERT INTO notifications (
      account_no,
      title,
      message,
      is_read
    ) VALUES (
      p_sender_account,
      'Transfer Successful',
      'You have successfully transferred USD ' || p_amount::TEXT || ' to ' || p_recipient_name,
      false
    );
    
    -- Create notification for recipient
    INSERT INTO notifications (
      account_no,
      title,
      message,
      is_read
    ) VALUES (
      p_recipient_account,
      'Transfer Received',
      'You have received USD ' || p_amount::TEXT || ' from ' || p_sender_name,
      false
    );
    
    -- Return success
    RETURN jsonb_build_object('success', true, 'message', 'Transfer completed successfully');
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback is automatic on exception
      RETURN jsonb_build_object('success', false, 'message', SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql;
