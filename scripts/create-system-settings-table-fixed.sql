-- Drop existing table and policies if they exist
DROP POLICY IF EXISTS "Admin can manage system settings" ON system_settings;
DROP TABLE IF EXISTS system_settings;

-- Create system_settings table for application configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can access system settings
CREATE POLICY "Only admins can view system settings" ON public.system_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Only admins can modify system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Create updated_at trigger
DROP TRIGGER IF EXISTS handle_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER handle_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings
INSERT INTO public.system_settings (category, settings) VALUES
('general', '{
    "session_timeout": 30,
    "max_login_attempts": 5,
    "kyc_auto_approval": false,
    "maintenance_mode": false,
    "maintenance_message": "System is under maintenance. Please try again later."
}'),
('security', '{
    "password_min_length": 8,
    "require_2fa": false,
    "session_timeout_warning": 5,
    "auto_logout_inactive": true,
    "ip_whitelist_enabled": false,
    "ip_whitelist": []
}'),
('notifications', '{
    "email_notifications": true,
    "sms_notifications": true,
    "push_notifications": true,
    "transaction_alerts": true,
    "login_alerts": true,
    "kyc_alerts": true
}'),
('limits', '{
    "daily_transfer_limit": 1000000,
    "monthly_transfer_limit": 10000000,
    "single_transaction_limit": 500000,
    "daily_withdrawal_limit": 200000,
    "monthly_withdrawal_limit": 2000000
}'),
('rates_fees', '{
    "savings_interest_rate": 2.5,
    "loan_interest_rate": 15.0,
    "transfer_fee": 50,
    "withdrawal_fee": 25,
    "monthly_maintenance_fee": 100,
    "overdraft_fee": 500
}'),
('maintenance', '{
    "scheduled_maintenance": false,
    "maintenance_start": null,
    "maintenance_end": null,
    "maintenance_message": "Scheduled maintenance in progress.",
    "allow_admin_access": true
}')
ON CONFLICT (category) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.system_settings TO authenticated;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
