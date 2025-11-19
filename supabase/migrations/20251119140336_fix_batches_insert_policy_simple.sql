/*
  # Fix Batches Insert Policy

  1. Changes
    - Drop the existing restrictive INSERT policy
    - Add a simple policy that allows any authenticated user who is an admin to insert batches
    - This fixes the batch creation issue in the Attendance Tracker
  
  2. Security
    - Only authenticated users can insert
    - User must exist in admins table
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Allow authenticated admins to insert batches" ON batches;

-- Create a simpler insert policy that allows admins and editors to create batches
CREATE POLICY "Admins and Editors can create batches"
  ON batches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
      AND admins.role IN ('admin', 'editor')
    )
  );
