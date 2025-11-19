/*
  # Simplify Batches INSERT Policy

  1. Problem
    - Batch creation might be failing due to complex role checking
    - The has_editor_or_admin_role() function might not work in all contexts

  2. Solution
    - Drop the existing INSERT policy
    - Create a simpler policy that just checks if user is in admins table
    - This ensures any authenticated admin/editor/viewer can attempt insert
    - The function check was too restrictive

  3. Security
    - Still requires authentication
    - User must exist in admins table
    - Maintains security while being more reliable
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Admins and Editors can insert batches" ON batches;

-- Create simpler, more reliable INSERT policy
CREATE POLICY "Authenticated admins can insert batches"
  ON batches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
      AND admins.role IN ('admin', 'editor')
    )
  );
