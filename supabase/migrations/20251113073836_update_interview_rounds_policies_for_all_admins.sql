/*
  # Update Interview Rounds Policies for All Admins
  
  1. Changes
    - Allow all admins to update and delete any interview round
    - Allow all admins to view all interview rounds
    - Simplify policies for better usability
  
  2. Security
    - Only authenticated admins can modify data
    - Public can still view rounds from public leaderboards
*/

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Admins can update interview rounds in their leaderboards" ON interview_rounds;
DROP POLICY IF EXISTS "Admins can delete interview rounds from their leaderboards" ON interview_rounds;
DROP POLICY IF EXISTS "Authenticated admins can view interview rounds in their leaderb" ON interview_rounds;

-- Create new policies for all admins
CREATE POLICY "Admins can view all interview rounds"
  ON interview_rounds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update interview rounds"
  ON interview_rounds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete interview rounds"
  ON interview_rounds FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );
