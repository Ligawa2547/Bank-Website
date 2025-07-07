-- ====================================================================
--  Admin Dashboard Statistics Function
--  Run this script once in Supabase SQL Editor (or via v0 "Run Script")
-- ====================================================================

BEGIN;

-----------------------------------------------------------------------
-- Create or replace the admin dashboard stats function
-----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (
            SELECT COUNT(*) FROM public.users
        ),
        'active_users', (
            SELECT COUNT(*) FROM public.users WHERE status = 'active'
        ),
        'suspended_users', (
            SELECT COUNT(*) FROM public.users WHERE status = 'suspended'
        ),
        'pending_users', (
            SELECT COUNT(*) FROM public.users WHERE status = 'pending'
        ),
        'new_users_today', (
            SELECT COUNT(*) FROM public.users 
            WHERE DATE(created_at) = CURRENT_DATE
        ),
        'total_balance', (
            SELECT COALESCE(SUM(CAST(account_balance AS NUMERIC)), 0) 
            FROM public.users 
            WHERE account_balance IS NOT NULL
        ),
        'total_transactions', (
            SELECT COUNT(*) FROM public.transactions
        ),
        'transactions_today', (
            SELECT COUNT(*) FROM public.transactions 
            WHERE DATE(created_at) = CURRENT_DATE
        ),
        'successful_transactions', (
            SELECT COUNT(*) FROM public.transactions 
            WHERE status = 'completed'
        ),
        'failed_transactions', (
            SELECT COUNT(*) FROM public.transactions 
            WHERE status = 'failed'
        ),
        'pending_transactions', (
            SELECT COUNT(*) FROM public.transactions 
            WHERE status = 'pending'
        ),
        'kyc_pending', (
            SELECT COUNT(*) FROM public.users 
            WHERE kyc_status = 'pending'
        ),
        'kyc_approved', (
            SELECT COUNT(*) FROM public.users 
            WHERE kyc_status = 'approved'
        ),
        'kyc_rejected', (
            SELECT COUNT(*) FROM public.users 
            WHERE kyc_status = 'rejected'
        ),
        'total_deposits', (
            SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) 
            FROM public.transactions 
            WHERE type = 'deposit' AND status = 'completed'
        ),
        'total_withdrawals', (
            SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) 
            FROM public.transactions 
            WHERE type = 'withdrawal' AND status = 'completed'
        ),
        'total_transfers', (
            SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) 
            FROM public.transactions 
            WHERE type = 'transfer' AND status = 'completed'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins will be filtered by RLS)
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

COMMIT;
