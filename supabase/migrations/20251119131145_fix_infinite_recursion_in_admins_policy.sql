/*
  # Fix Infinite Recursion in Admins Table Policy

  1. Problem
    - The SELECT policy on admins table was checking if user exists in admins table
    - This creates infinite recursion: to read admins, it needs to read admins
  
  2. Solution
    - Change policy to check auth.uid() directly without querying admins table
    - Users can only see their own admin record to avoid recursion
    - Helper functions already use SECURITY DEFINER which bypasses RLS
  
  3. Security
    - Each admin can only see their own record via direct SELECT
    - Helper functions (has_admin_role, etc.) use SECURITY DEFINER to bypass RLS
    - This ensures role checks work without triggering infinite recursion
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "All authenticated admins can view all admin records" ON admins;

-- Create a simple policy that checks auth.uid() directly
CREATE POLICY "Authenticated users can view their own admin record"
  ON admins FOR SELECT
  TO authenticated
  USING (id = auth.uid());
