-- Create KYC Documents Table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('national_id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement')),
  document_url TEXT,
  file_path TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  verified_by UUID REFERENCES public.admins(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_verification_status ON public.kyc_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_created_at ON public.kyc_documents(created_at);

-- Enable RLS
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF NOT EXISTS "Users can view their own kyc documents" ON public.kyc_documents;
DROP POLICY IF NOT EXISTS "Users can insert their own kyc documents" ON public.kyc_documents;
DROP POLICY IF NOT EXISTS "Admins can view all kyc documents" ON public.kyc_documents;
DROP POLICY IF NOT EXISTS "Admins can update kyc documents" ON public.kyc_documents;

-- Create RLS policies
CREATE POLICY "Users can view their own kyc documents"
  ON public.kyc_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own kyc documents"
  ON public.kyc_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all kyc documents"
  ON public.kyc_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update kyc documents"
  ON public.kyc_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.id = auth.uid()
    )
  );
