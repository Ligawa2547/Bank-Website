-- Create admins table for admin user management
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all admin records" ON public.admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Super admins can manage admin records" ON public.admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
        )
    );

-- Create function to automatically add admin users
CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the email domain is @iaenb.com
    IF NEW.email LIKE '%@iaenb.com' THEN
        INSERT INTO public.admins (user_id, email, role)
        VALUES (NEW.id, NEW.email, 'admin')
        ON CONFLICT (email) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add admin users
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_user();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_admins_updated_at ON public.admins;
CREATE TRIGGER handle_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default super admin (replace with actual admin email)
INSERT INTO public.admins (user_id, email, role) 
VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@iaenb.com' LIMIT 1),
    'admin@iaenb.com',
    'super_admin'
) ON CONFLICT (email) DO UPDATE SET role = 'super_admin';
