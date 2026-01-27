-- Enable RLS on tables that don't have it
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- ==================== TRANSACTIONS TABLE ====================
-- Users can view their own transactions (both as sender and recipient)
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (
    auth.uid()::text = user_id OR 
    (SELECT auth_user_id FROM public.users WHERE id = auth.uid()) = sender_account_number OR
    (SELECT auth_user_id FROM public.users WHERE id = auth.uid()) = recipient_account_number
  );

-- Users can insert their own transactions
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id
  );

-- Users can update their own transactions (status changes)
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (
    auth.uid()::text = user_id
  ) WITH CHECK (
    auth.uid()::text = user_id
  );

-- ==================== USER_PROFILES TABLE ====================
-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() = user_id
  );

-- ==================== USERS TABLE ====================
-- Ensure existing policies are properly set
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (
    auth.uid() = id
  );

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (
    auth.uid() = id
  ) WITH CHECK (
    auth.uid() = id
  );

-- ==================== CARD_DETAILS TABLE ====================
DROP POLICY IF EXISTS "Users can view own card details" ON public.card_details;
CREATE POLICY "Users can view own card details" ON public.card_details
  FOR SELECT USING (
    auth.uid() = id OR 
    (SELECT user_id FROM public.user_profiles WHERE account_no = card_details.account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own card details" ON public.card_details;
CREATE POLICY "Users can insert own card details" ON public.card_details
  FOR INSERT WITH CHECK (
    (SELECT user_id FROM public.user_profiles WHERE account_no = account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own card details" ON public.card_details;
CREATE POLICY "Users can update own card details" ON public.card_details
  FOR UPDATE USING (
    (SELECT user_id FROM public.user_profiles WHERE account_no = card_details.account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own card details" ON public.card_details;
CREATE POLICY "Users can delete own card details" ON public.card_details
  FOR DELETE USING (
    (SELECT user_id FROM public.user_profiles WHERE account_no = card_details.account_no LIMIT 1) = auth.uid()
  );

-- ==================== KYC_SUBMISSIONS TABLE ====================
DROP POLICY IF EXISTS "Users can view own KYC" ON public.kyc_submissions;
CREATE POLICY "Users can view own KYC" ON public.kyc_submissions
  FOR SELECT USING (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can insert own KYC" ON public.kyc_submissions;
CREATE POLICY "Users can insert own KYC" ON public.kyc_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- ==================== NOTIFICATIONS TABLE ====================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (
    auth.uid() = user_id OR
    (SELECT id FROM public.users WHERE account_no = notifications.account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (SELECT id FROM public.users WHERE account_no = notifications.account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (
    auth.uid() = user_id OR
    (SELECT id FROM public.users WHERE account_no = notifications.account_no LIMIT 1) = auth.uid()
  );

-- ==================== SAVINGS_ACCOUNTS TABLE ====================
DROP POLICY IF EXISTS "Users can view own savings accounts" ON public.savings_accounts;
CREATE POLICY "Users can view own savings accounts" ON public.savings_accounts
  FOR SELECT USING (
    (SELECT id FROM public.users WHERE account_no = savings_accounts.account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own savings accounts" ON public.savings_accounts;
CREATE POLICY "Users can insert own savings accounts" ON public.savings_accounts
  FOR INSERT WITH CHECK (
    (SELECT id FROM public.users WHERE account_no = account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own savings accounts" ON public.savings_accounts;
CREATE POLICY "Users can update own savings accounts" ON public.savings_accounts
  FOR UPDATE USING (
    (SELECT id FROM public.users WHERE account_no = savings_accounts.account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own savings accounts" ON public.savings_accounts;
CREATE POLICY "Users can delete own savings accounts" ON public.savings_accounts
  FOR DELETE USING (
    (SELECT id FROM public.users WHERE account_no = savings_accounts.account_no LIMIT 1) = auth.uid()
  );

-- ==================== SAVINGS_TRANSACTIONS TABLE ====================
DROP POLICY IF EXISTS "Users can view own savings transactions" ON public.savings_transactions;
CREATE POLICY "Users can view own savings transactions" ON public.savings_transactions
  FOR SELECT USING (
    (SELECT id FROM public.users WHERE account_no = savings_transactions.account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own savings transactions" ON public.savings_transactions;
CREATE POLICY "Users can insert own savings transactions" ON public.savings_transactions
  FOR INSERT WITH CHECK (
    (SELECT id FROM public.users WHERE account_no = account_no LIMIT 1) = auth.uid()
  );

-- ==================== SUPPORT_TICKETS TABLE ====================
DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
CREATE POLICY "Users can view own support tickets" ON public.support_tickets
  FOR SELECT USING (
    (SELECT id FROM public.users WHERE account_no = support_tickets.account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own support tickets" ON public.support_tickets;
CREATE POLICY "Users can insert own support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (
    (SELECT id FROM public.users WHERE account_no = account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own support tickets" ON public.support_tickets;
CREATE POLICY "Users can update own support tickets" ON public.support_tickets
  FOR UPDATE USING (
    (SELECT id FROM public.users WHERE account_no = support_tickets.account_no LIMIT 1) = auth.uid()
  );

-- ==================== BANK_ACCOUNTS TABLE ====================
DROP POLICY IF EXISTS "Users can view own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can view own bank accounts" ON public.bank_accounts
  FOR SELECT USING (
    (SELECT id FROM public.users WHERE account_no = bank_accounts.account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can insert own bank accounts" ON public.bank_accounts
  FOR INSERT WITH CHECK (
    (SELECT id FROM public.users WHERE account_no = account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can update own bank accounts" ON public.bank_accounts
  FOR UPDATE USING (
    (SELECT id FROM public.users WHERE account_no = bank_accounts.account_no LIMIT 1) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can delete own bank accounts" ON public.bank_accounts
  FOR DELETE USING (
    (SELECT id FROM public.users WHERE account_no = bank_accounts.account_no LIMIT 1) = auth.uid()
  );

-- ==================== LOAN_APPLICATIONS TABLE ====================
DROP POLICY IF EXISTS "Users can view own loan applications" ON public.loan_applications;
CREATE POLICY "Users can view own loan applications" ON public.loan_applications
  FOR SELECT USING (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can insert own loan applications" ON public.loan_applications;
CREATE POLICY "Users can insert own loan applications" ON public.loan_applications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can update own loan applications" ON public.loan_applications;
CREATE POLICY "Users can update own loan applications" ON public.loan_applications
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- ==================== LOAN_REPAYMENTS TABLE ====================
DROP POLICY IF EXISTS "Users can view own loan repayments" ON public.loan_repayments;
CREATE POLICY "Users can view own loan repayments" ON public.loan_repayments
  FOR SELECT USING (
    (SELECT user_id FROM public.loan_applications WHERE id = loan_repayments.loan_application_id LIMIT 1) = auth.uid()
  );

-- ==================== REFERRALS TABLE ====================
DROP POLICY IF EXISTS "Users can view referrals" ON public.referrals;
CREATE POLICY "Users can view referrals" ON public.referrals
  FOR SELECT USING (
    (SELECT id FROM public.users WHERE account_no = referrer_account_no LIMIT 1) = auth.uid() OR
    (SELECT id FROM public.users WHERE account_no = referred_account_no LIMIT 1) = auth.uid()
  );

-- ==================== APP_SETTINGS TABLE ====================
-- Only admins can manage settings
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.app_settings;
CREATE POLICY "Authenticated users can view settings" ON public.app_settings
  FOR SELECT USING (auth.role() = 'authenticated');
