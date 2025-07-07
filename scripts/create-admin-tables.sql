-- Create admin_notifications table for admin-specific notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_activity_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT, -- 'user', 'transaction', 'kyc', etc.
    target_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_settings table for system configuration
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
    total_users BIGINT,
    pending_kyc BIGINT,
    suspended_accounts BIGINT,
    total_balance NUMERIC,
    today_transactions BIGINT,
    failed_transactions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE kyc_status = 'pending') as pending_kyc,
        (SELECT COUNT(*) FROM users WHERE status = 'suspended') as suspended_accounts,
        (SELECT COALESCE(SUM(account_balance), 0) FROM users) as total_balance,
        (SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed') as today_transactions,
        (SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURRENT_DATE AND status = 'failed') as failed_transactions;
END;
$$ LANGUAGE plpgsql;

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
    ('system_maintenance', '{"enabled": false, "message": "System maintenance in progress"}', 'System maintenance mode'),
    ('max_transaction_amount', '{"value": 100000}', 'Maximum transaction amount allowed'),
    ('kyc_auto_approval', '{"enabled": false}', 'Automatic KYC approval for certain criteria'),
    ('notification_templates', '{"welcome": "Welcome to I&E Bank!", "kyc_approved": "Your KYC has been approved"}', 'Notification message templates')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_email ON admin_activity_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Create RLS policies for admin tables
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Admin notifications policy (admins can see all)
CREATE POLICY "Admin notifications access" ON admin_notifications
    FOR ALL USING (
        auth.jwt() ->> 'email' LIKE '%@iaenb.com'
    );

-- Admin activity log policy (admins can see all)
CREATE POLICY "Admin activity log access" ON admin_activity_log
    FOR ALL USING (
        auth.jwt() ->> 'email' LIKE '%@iaenb.com'
    );

-- Admin settings policy (admins can see all)
CREATE POLICY "Admin settings access" ON admin_settings
    FOR ALL USING (
        auth.jwt() ->> 'email' LIKE '%@iaenb.com'
    );

-- Function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_admin_email TEXT,
    p_action TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_activity_log (
        admin_email,
        action,
        target_type,
        target_id,
        details,
        created_at
    ) VALUES (
        p_admin_email,
        p_action,
        p_target_type,
        p_target_id,
        p_details,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to admin tables
CREATE TRIGGER update_admin_notifications_updated_at
    BEFORE UPDATE ON admin_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin notifications
INSERT INTO admin_notifications (title, message, type) VALUES
    ('System Status', 'All systems are operating normally', 'success'),
    ('Pending KYC Reviews', 'There are new KYC applications awaiting review', 'info'),
    ('Security Alert', 'Multiple failed login attempts detected', 'warning');
