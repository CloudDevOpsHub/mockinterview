/*
  # Fix Interview Rounds RLS Policy
  
  1. Changes
    - Update INSERT policy for interview_rounds to properly check leaderboard ownership
    - The issue is that leaderboards.created_by references admins(id) which references auth.users(id)
    - Since auth.uid() returns the user's auth ID, we need to ensure it matches correctly
  
  2. Security
    - Authenticated users can only insert rounds into leaderboards they created
    - Maintains secure access control
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Admins can create interview rounds in their leaderboards" ON interview_rounds;

-- Create new policy with corrected logic
CREATE POLICY "Admins can create interview rounds in their leaderboards"
  ON interview_rounds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = leaderboard_id
      AND (
        leaderboards.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM admins
          WHERE admins.id = auth.uid()
        )
      )
    )
  );
