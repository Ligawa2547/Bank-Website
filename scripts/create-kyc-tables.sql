-- Create KYC documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_no VARCHAR(20) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('national_id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement')),
    document_number VARCHAR(100),
    document_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_account_no ON kyc_documents(account_no);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_submitted_at ON kyc_documents(submitted_at);

-- Add KYC status column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_status') THEN
        ALTER TABLE users ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected'));
    END IF;
END $$;

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for KYC documents
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- Users can only see their own KYC documents
CREATE POLICY "Users can view own KYC documents" ON kyc_documents
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own KYC documents
CREATE POLICY "Users can insert own KYC documents" ON kyc_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending KYC documents
CREATE POLICY "Users can update own pending KYC documents" ON kyc_documents
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all KYC documents
CREATE POLICY "Admins can view all KYC documents" ON kyc_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- Set up storage policies for KYC documents
CREATE POLICY "Users can upload own KYC documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kyc-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can view all KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' 
        AND EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );
