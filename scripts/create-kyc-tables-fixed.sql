-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create KYC submissions table
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_no TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('national_id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement')),
    document_number TEXT,
    document_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    fee_paid DECIMAL(10,2) DEFAULT 35.00,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_account_no ON kyc_submissions(account_no);

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add kyc_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_status') THEN
        ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected'));
    END IF;

    -- Add verification_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_status') THEN
        ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified'));
    END IF;

    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_verified') THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add phone_number column if it doesn't exist (some tables might use 'phone' instead)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_number') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
            -- Rename phone to phone_number for consistency
            ALTER TABLE users RENAME COLUMN phone TO phone_number;
        ELSE
            -- Add phone_number column
            ALTER TABLE users ADD COLUMN phone_number TEXT;
        END IF;
    END IF;
END $$;

-- Create or replace function to update user KYC status
CREATE OR REPLACE FUNCTION update_user_kyc_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's KYC status based on submission status
    UPDATE users 
    SET 
        kyc_status = NEW.status,
        verification_status = CASE 
            WHEN NEW.status = 'approved' THEN 'verified'
            WHEN NEW.status = 'rejected' THEN 'unverified'
            ELSE verification_status
        END,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user status when KYC status changes
DROP TRIGGER IF EXISTS trigger_update_user_kyc_status ON kyc_submissions;
CREATE TRIGGER trigger_update_user_kyc_status
    AFTER INSERT OR UPDATE OF status ON kyc_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_kyc_status();

-- Create storage bucket for KYC documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for KYC documents
DO $$
BEGIN
    -- Policy for users to upload their own documents
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own KYC documents'
    ) THEN
        CREATE POLICY "Users can upload their own KYC documents"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'kyc-documents' 
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Policy for users to view their own documents
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can view their own KYC documents'
    ) THEN
        CREATE POLICY "Users can view their own KYC documents"
        ON storage.objects FOR SELECT
        USING (
            bucket_id = 'kyc-documents' 
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Policy for admins to view all documents (if admin table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'storage' 
            AND tablename = 'objects' 
            AND policyname = 'Admins can view all KYC documents'
        ) THEN
            CREATE POLICY "Admins can view all KYC documents"
            ON storage.objects FOR SELECT
            USING (
                bucket_id = 'kyc-documents' 
                AND EXISTS (
                    SELECT 1 FROM admins 
                    WHERE id = auth.uid() AND status = 'active'
                )
            );
        END IF;
    END IF;
END $$;

-- RLS policies for kyc_submissions table
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own submissions
CREATE POLICY "Users can view their own KYC submissions"
ON kyc_submissions FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to insert their own submissions
CREATE POLICY "Users can insert their own KYC submissions"
ON kyc_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for admins to view all submissions (if admin table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        CREATE POLICY "Admins can view all KYC submissions"
        ON kyc_submissions FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM admins 
                WHERE id = auth.uid() AND status = 'active'
            )
        );
    END IF;
END $$;

-- Create function for safe balance updates
CREATE OR REPLACE FUNCTION update_user_balance(
    user_uuid UUID,
    amount_change DECIMAL(10,2),
    operation_type TEXT DEFAULT 'debit'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL(10,2);
    new_balance DECIMAL(10,2);
BEGIN
    -- Get current balance
    SELECT account_balance INTO current_balance 
    FROM users 
    WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Calculate new balance
    IF operation_type = 'debit' THEN
        new_balance := current_balance - amount_change;
        
        -- Check if user has sufficient balance
        IF new_balance < 0 THEN
            RAISE EXCEPTION 'Insufficient balance';
        END IF;
    ELSE
        new_balance := current_balance + amount_change;
    END IF;
    
    -- Update balance
    UPDATE users 
    SET 
        account_balance = new_balance,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
