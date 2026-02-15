-- Add agreement tracking columns to users table if they don't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS agreement_sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS agreement_version VARCHAR(50) DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS agreement_status VARCHAR(50) DEFAULT 'pending';

-- Create agreements table for tracking agreement history (without FK to avoid constraint issues)
CREATE TABLE IF NOT EXISTS public.agreements (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  account_number VARCHAR(50),
  agreement_version VARCHAR(50) DEFAULT '1.0',
  sent_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  viewed_date TIMESTAMP WITH TIME ZONE,
  acknowledged_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'sent',
  agreement_html TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_agreements_user_id ON public.agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_agreements_sent_date ON public.agreements(sent_date);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON public.agreements(status);

-- Enable RLS on agreements table
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies for agreements table
DROP POLICY IF EXISTS "Anyone can insert agreements" ON public.agreements;
CREATE POLICY "Anyone can insert agreements"
  ON public.agreements FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view agreements" ON public.agreements;
CREATE POLICY "Anyone can view agreements"
  ON public.agreements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can update agreements" ON public.agreements;
CREATE POLICY "Anyone can update agreements"
  ON public.agreements FOR UPDATE
  USING (true)
  WITH CHECK (true);
