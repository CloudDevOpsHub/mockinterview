/*
  # Fix Batches INSERT - Grant to All Admins

  1. Problem
    - Batch creation still failing despite correct policy
    - May be an issue with subquery in WITH CHECK clause
    
  2. Solution
    - Drop the restrictive policy
    - Create a simple policy that allows all authenticated users in admins table
    - Remove role restriction temporarily to identify if that's the issue
    
  3. Security
    - Still requires authentication
    - User must exist in admins table (any role)
    - Can add role restriction back after confirming this works
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authenticated admins can insert batches" ON batches;

-- Create very simple INSERT policy - allow all users in admins table
CREATE POLICY "Allow authenticated admins to insert batches"
  ON batches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );
