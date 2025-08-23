-- Create system_settings table for admin settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    settings JSONB NOT NULL DEFAULT '{
        "maintenance_mode": false,
        "maintenance_message": "System is under maintenance. Please try again later.",
        "max_login_attempts": 5,
        "session_timeout": 30,
        "email_notifications": true,
        "sms_notifications": false,
        "kyc_auto_approval": false,
        "transaction_limits": {
            "daily_limit": 50000,
            "monthly_limit": 500000,
            "single_transaction_limit": 100000
        },
        "interest_rates": {
            "savings_rate": 2.5,
            "loan_rate": 8.5
        },
        "fees": {
            "transfer_fee": 25,
            "withdrawal_fee": 10,
            "maintenance_fee": 100
        }
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Insert default settings if not exists
INSERT INTO system_settings (id, settings) 
VALUES (1, '{
    "maintenance_mode": false,
    "maintenance_message": "System is under maintenance. Please try again later.",
    "max_login_attempts": 5,
    "session_timeout": 30,
    "email_notifications": true,
    "sms_notifications": false,
    "kyc_auto_approval": false,
    "transaction_limits": {
        "daily_limit": 50000,
        "monthly_limit": 500000,
        "single_transaction_limit": 100000
    },
    "interest_rates": {
        "savings_rate": 2.5,
        "loan_rate": 8.5
    },
    "fees": {
        "transfer_fee": 25,
        "withdrawal_fee": 10,
        "maintenance_fee": 100
    }
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email LIKE '%@iaenb.com'
        )
    );

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_system_settings_timestamp
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_timestamp();
