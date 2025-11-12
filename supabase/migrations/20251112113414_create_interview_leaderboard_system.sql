/*
  # Create Interview Leaderboard System

  1. New Tables
    - `interview_sessions`
      - `id` (uuid, primary key)
      - `session_name` (text) - Name of the interview session
      - `session_date` (date) - Date of the session
      - `public_id` (text, unique) - Public URL identifier
      - `is_active` (boolean) - Whether session is active
      - `created_by` (uuid) - Admin who created it
      - `created_at` (timestamptz)
    
    - `interview_scores`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to interview_sessions)
      - `candidate_name` (text) - Name of the candidate
      - `technical_score` (integer) - Score for technical skills (0-100)
      - `communication_score` (integer) - Score for communication (0-100)
      - `problem_solving_score` (integer) - Score for problem solving (0-100)
      - `overall_score` (integer) - Overall score (calculated)
      - `feedback` (text) - Optional feedback
      - `rank` (integer) - Rank in the session
      - `created_at` (timestamptz)
      - Unique constraint on (session_id, candidate_name)
  
  2. Security
    - Enable RLS on both tables
    - Admins can manage all records
    - Public can view active sessions via public_id
*/

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name text NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  public_id text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create interview_scores table
CREATE TABLE IF NOT EXISTS interview_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  candidate_name text NOT NULL,
  technical_score integer CHECK (technical_score >= 0 AND technical_score <= 100) NOT NULL,
  communication_score integer CHECK (communication_score >= 0 AND communication_score <= 100) NOT NULL,
  problem_solving_score integer CHECK (problem_solving_score >= 0 AND problem_solving_score <= 100) NOT NULL,
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100) NOT NULL,
  feedback text DEFAULT '',
  rank integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, candidate_name)
);

-- Enable RLS
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_scores ENABLE ROW LEVEL SECURITY;

-- Policies for interview_sessions
CREATE POLICY "Admins can view all interview sessions"
  ON interview_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create interview sessions"
  ON interview_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their interview sessions"
  ON interview_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can delete their interview sessions"
  ON interview_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Public can view active interview sessions"
  ON interview_sessions FOR SELECT
  TO anon
  USING (is_active = true);

-- Policies for interview_scores
CREATE POLICY "Admins can view all interview scores"
  ON interview_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create interview scores"
  ON interview_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_id
      AND interview_sessions.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update interview scores"
  ON interview_scores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_id
      AND interview_sessions.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_id
      AND interview_sessions.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete interview scores"
  ON interview_scores FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_id
      AND interview_sessions.created_by = auth.uid()
    )
  );

CREATE POLICY "Public can view scores from active sessions"
  ON interview_scores FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_id
      AND interview_sessions.is_active = true
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_public_id ON interview_sessions(public_id);
CREATE INDEX IF NOT EXISTS idx_interview_scores_session_id ON interview_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_scores_rank ON interview_scores(session_id, rank);
