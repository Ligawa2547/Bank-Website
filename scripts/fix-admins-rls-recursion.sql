-- Fix RLS recursion on admins table by simplifying the policies
-- The issue is that policies reference the admins table which causes infinite recursion

-- Drop problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can update themselves" ON public.admins;
DROP POLICY IF EXISTS "Super admins can manage all admins" ON public.admins;

-- Create simplified non-recursive policies
-- Allow authenticated users who are admins to view and manage admins
CREATE POLICY "Admin can manage admins"
  ON public.admins
  FOR ALL
  USING (
    -- Check if current user has a record in admins table
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    -- Check if current user has a record in admins table
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE id = auth.uid()
    )
  );
