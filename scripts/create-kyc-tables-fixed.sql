-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS kyc_submissions CASCADE;
DROP TABLE IF EXISTS kyc_documents CASCADE;

-- Create KYC submissions table with proper structure
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_no VARCHAR(20) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('national_id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement')),
    document_number VARCHAR(100),
    document_front_url TEXT,
    document_back_url TEXT,
    selfie_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_account_no ON kyc_submissions(account_no);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_submitted_at ON kyc_submissions(submitted_at);

-- Add KYC status and verification status columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add kyc_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_status') THEN
        ALTER TABLE users ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected'));
    END IF;
    
    -- Add verification_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_status') THEN
        ALTER TABLE users ADD COLUMN verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
    END IF;
    
    -- Add date_of_birth column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'date_of_birth') THEN
        ALTER TABLE users ADD COLUMN date_of_birth DATE;
    END IF;
END $$;

-- Create storage bucket for KYC documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for KYC submissions
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own KYC submissions" ON kyc_submissions;
DROP POLICY IF EXISTS "Users can insert own KYC submissions" ON kyc_submissions;
DROP POLICY IF EXISTS "Users can update own pending KYC submissions" ON kyc_submissions;
DROP POLICY IF EXISTS "Admins can view all KYC submissions" ON kyc_submissions;

-- Users can only see their own KYC submissions (using id column)
CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own KYC submissions (using id column)
CREATE POLICY "Users can insert own KYC submissions" ON kyc_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending KYC submissions (using id column)
CREATE POLICY "Users can update own pending KYC submissions" ON kyc_submissions
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Check if admins table exists before creating admin policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        -- Admins can view all KYC submissions (using id column for admin lookup)
        EXECUTE 'CREATE POLICY "Admins can view all KYC submissions" ON kyc_submissions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM admins 
                    WHERE id = auth.uid() 
                    AND status = ''active''
                )
            )';
    END IF;
END $$;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;

-- Set up storage policies for KYC documents using owner column
CREATE POLICY "Users can upload own KYC documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kyc-documents' 
        AND auth.uid() = owner
    );

CREATE POLICY "Users can view own KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' 
        AND auth.uid() = owner
    );

-- Check if admins table exists before creating admin storage policy
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        EXECUTE 'CREATE POLICY "Admins can view all KYC documents" ON storage.objects
            FOR SELECT USING (
                bucket_id = ''kyc-documents'' 
                AND EXISTS (
                    SELECT 1 FROM admins 
                    WHERE id = auth.uid() 
                    AND status = ''active''
                )
            )';
    END IF;
END $$;

-- Function to automatically update user verification status when KYC is approved/rejected
CREATE OR REPLACE FUNCTION update_user_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user verification status based on KYC submission status (using id column)
    UPDATE users 
    SET 
        verification_status = CASE 
            WHEN NEW.status = 'approved' THEN 'verified'
            WHEN NEW.status = 'rejected' THEN 'rejected'
            ELSE 'pending'
        END,
        kyc_status = NEW.status,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user status
DROP TRIGGER IF EXISTS trigger_update_user_verification_status ON kyc_submissions;
CREATE TRIGGER trigger_update_user_verification_status
    AFTER UPDATE ON kyc_submissions
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_user_verification_status();

-- Also create trigger for INSERT to handle admin submissions
DROP TRIGGER IF EXISTS trigger_update_user_verification_status_insert ON kyc_submissions;
CREATE TRIGGER trigger_update_user_verification_status_insert
    AFTER INSERT ON kyc_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_verification_status();
