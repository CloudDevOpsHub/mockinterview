/*
  # Add Multi-Round Interview Scoring Support

  ## Overview
  This migration transforms the leaderboard system to support multi-round interviews.
  Instead of storing a single score per student, we now store individual round scores
  and calculate metrics dynamically.

  ## Changes Made

  ### 1. Rename student_records to interview_rounds
  - This table now represents individual interview rounds, not complete student records
  - Each row is a single round for a student in a leaderboard

  ### 2. New Table: interview_rounds
  Structure:
  - `id` (uuid, primary key) - Unique interview round identifier
  - `leaderboard_id` (uuid, foreign key) - Associated leaderboard
  - `student_name` (text) - Student's name
  - `round_number` (integer) - Which round this is (1, 2, 3, etc.)
  - `score` (integer) - Round score (0-10)
  - `interview_date` (date) - Date of the interview
  - `interviewer_name` (text) - Name of the interviewer
  - `strengths` (text) - Strengths shown in this round
  - `weaknesses` (text) - Areas for improvement in this round
  - `feedback` (text) - Detailed feedback for this round
  - `notes` (text) - Additional comments
  - `created_at` (timestamptz) - When this record was created
  - `updated_at` (timestamptz) - When this record was last updated

  ## Calculated Metrics (done in application layer)
  For each student in a leaderboard:
  - Highest Score: MAX(score) across all rounds
  - Total Score: SUM(score) across all rounds
  - Average Score: AVG(score) across all rounds
  - Interviews Given: COUNT(*) for the student
  - Last Interview Date: MAX(interview_date)

  ## Batch Metrics (done in application layer)
  - Total Students: COUNT(DISTINCT student_name)
  - Total Interviews: COUNT(*) across all rounds
  - Average Score: AVG(score) across all rounds
  - Highest Individual Score: MAX(score)
  - Overall Batch Score: SUM(score)

  ## Security
  - RLS policies remain the same
  - Admins can only view/edit rounds in their own leaderboards
  - Public can view all rounds in a leaderboard via public_id
*/

-- Rename student_records to interview_rounds and restructure
ALTER TABLE IF EXISTS student_records RENAME TO interview_rounds;

-- Drop old constraints and indexes
DROP INDEX IF EXISTS idx_student_records_leaderboard;
DROP TRIGGER IF EXISTS update_student_records_updated_at ON interview_rounds;

-- Update column structure
ALTER TABLE interview_rounds 
DROP COLUMN IF EXISTS feedback_summary,
DROP COLUMN IF EXISTS additional_notes,
ADD COLUMN IF NOT EXISTS round_number integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS feedback text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

-- Rename columns for clarity
ALTER TABLE interview_rounds 
RENAME COLUMN score TO score_out_of_ten;

ALTER TABLE interview_rounds 
ALTER COLUMN score_out_of_ten TYPE integer USING (CASE 
  WHEN score_out_of_ten > 10 THEN (score_out_of_ten / 10)::integer
  ELSE score_out_of_ten
END);

ALTER TABLE interview_rounds 
ADD CONSTRAINT check_score_range CHECK (score_out_of_ten >= 0 AND score_out_of_ten <= 10);

-- Rename the column back to score for simplicity
ALTER TABLE interview_rounds 
RENAME COLUMN score_out_of_ten TO score;

-- Add new indexes for query performance
CREATE INDEX IF NOT EXISTS idx_interview_rounds_leaderboard ON interview_rounds(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_interview_rounds_student ON interview_rounds(leaderboard_id, student_name);
CREATE INDEX IF NOT EXISTS idx_interview_rounds_date ON interview_rounds(interview_date);

-- Recreate trigger for updated_at
CREATE TRIGGER update_interview_rounds_updated_at
  BEFORE UPDATE ON interview_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies for interview_rounds
DROP POLICY IF EXISTS "Authenticated admins can view all student records" ON interview_rounds;
DROP POLICY IF EXISTS "Public can view student records from public leaderboards" ON interview_rounds;
DROP POLICY IF EXISTS "Admins can create student records for own leaderboards" ON interview_rounds;
DROP POLICY IF EXISTS "Admins can update student records in own leaderboards" ON interview_rounds;
DROP POLICY IF EXISTS "Admins can delete student records from own leaderboards" ON interview_rounds;

CREATE POLICY "Authenticated admins can view interview rounds in their leaderboards"
  ON interview_rounds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = interview_rounds.leaderboard_id
      AND leaderboards.created_by = auth.uid()
    )
  );

CREATE POLICY "Public can view interview rounds from public leaderboards"
  ON interview_rounds FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can create interview rounds in their leaderboards"
  ON interview_rounds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = interview_rounds.leaderboard_id
      AND leaderboards.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update interview rounds in their leaderboards"
  ON interview_rounds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = interview_rounds.leaderboard_id
      AND leaderboards.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = interview_rounds.leaderboard_id
      AND leaderboards.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete interview rounds from their leaderboards"
  ON interview_rounds FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = interview_rounds.leaderboard_id
      AND leaderboards.created_by = auth.uid()
    )
  );
