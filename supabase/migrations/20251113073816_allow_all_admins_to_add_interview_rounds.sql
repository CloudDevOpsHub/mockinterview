/*
  # Allow All Admins to Add Interview Rounds
  
  1. Changes
    - Update INSERT policy for interview_rounds to allow any authenticated admin
    - Admins should be able to add rounds to any leaderboard
    - Check that the user exists in the admins table
  
  2. Security
    - Only authenticated users who are in the admins table can insert
    - Maintains security while allowing flexibility
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins can create interview rounds in their leaderboards" ON interview_rounds;

-- Create new policy allowing all admins to add rounds
CREATE POLICY "Admins can create interview rounds"
  ON interview_rounds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );
