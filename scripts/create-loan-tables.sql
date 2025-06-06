-- Create loan_types table
CREATE TABLE IF NOT EXISTS public.loan_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    min_amount DECIMAL(15,2) NOT NULL DEFAULT 100,
    max_amount DECIMAL(15,2) NOT NULL DEFAULT 50000,
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    term_months INTEGER NOT NULL DEFAULT 12,
    requirements TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loan_applications table
CREATE TABLE IF NOT EXISTS public.loan_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loan_type_id UUID NOT NULL REFERENCES public.loan_types(id) ON DELETE CASCADE,
    requested_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'completed')),
    purpose TEXT,
    employment_status VARCHAR(100),
    monthly_income DECIMAL(15,2),
    existing_loans BOOLEAN DEFAULT false,
    credit_score INTEGER,
    application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approval_date TIMESTAMP WITH TIME ZONE,
    disbursement_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loan_repayments table
CREATE TABLE IF NOT EXISTS public.loan_repayments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    penalty_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default loan types
INSERT INTO public.loan_types (name, description, min_amount, max_amount, interest_rate, term_months, requirements) VALUES
('Personal Loan', 'Quick personal loans for any purpose', 500, 10000, 8.5, 12, ARRAY['Active account for 1+ months', 'Steady income', 'Good credit history']),
('Emergency Loan', 'Fast loans for emergency situations', 100, 2000, 12.0, 6, ARRAY['Active account', 'Valid ID', 'Emergency documentation']),
('Business Loan', 'Loans for business expansion and operations', 2000, 50000, 6.5, 24, ARRAY['Business registration', 'Financial statements', 'Account history 6+ months']),
('Education Loan', 'Loans for educational expenses', 1000, 25000, 4.5, 36, ARRAY['Enrollment proof', 'Academic records', 'Co-signer may be required']),
('Home Improvement', 'Loans for home renovation and improvement', 1500, 30000, 7.0, 18, ARRAY['Property ownership proof', 'Renovation estimates', 'Stable income']);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON public.loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON public.loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan_id ON public.loan_repayments(loan_application_id);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_due_date ON public.loan_repayments(due_date);

-- Enable RLS (Row Level Security)
ALTER TABLE public.loan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Loan types: Everyone can read active loan types
CREATE POLICY "Anyone can view active loan types" ON public.loan_types
    FOR SELECT USING (is_active = true);

-- Loan applications: Users can only see their own applications
CREATE POLICY "Users can view own loan applications" ON public.loan_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loan applications" ON public.loan_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan applications" ON public.loan_applications
    FOR UPDATE USING (auth.uid() = user_id);

-- Loan repayments: Users can only see their own repayments
CREATE POLICY "Users can view own loan repayments" ON public.loan_repayments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.loan_applications 
            WHERE id = loan_application_id AND user_id = auth.uid()
        )
    );
