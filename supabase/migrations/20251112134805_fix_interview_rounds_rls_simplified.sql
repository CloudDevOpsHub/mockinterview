/*
  # Fix Interview Rounds RLS Policy - Simplified
  
  1. Changes
    - Simplify the INSERT policy for interview_rounds
    - The leaderboards.created_by is a UUID that directly matches auth.uid()
    - Remove unnecessary subquery complexity
  
  2. Security
    - Users can only insert rounds into leaderboards they own
    - Direct comparison between auth.uid() and leaderboards.created_by
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can create interview rounds in their leaderboards" ON interview_rounds;

-- Create simplified policy
CREATE POLICY "Admins can create interview rounds in their leaderboards"
  ON interview_rounds FOR INSERT
  TO authenticated
  WITH CHECK (
    leaderboard_id IN (
      SELECT id FROM leaderboards
      WHERE created_by = auth.uid()
    )
  );
