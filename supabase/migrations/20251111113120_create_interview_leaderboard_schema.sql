/*
  # Mock Interview Leaderboard Schema

  ## Overview
  Creates the complete database schema for the Mock Interview Leaderboard application.
  This migration sets up tables for admin users, leaderboards, and student interview records.

  ## Tables Created

  ### 1. admins
  Stores admin user authentication and profile information
  - `id` (uuid, primary key) - Unique admin identifier linked to auth.users
  - `email` (text, unique) - Admin login email
  - `name` (text) - Admin display name
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. leaderboards
  Stores individual leaderboard instances (supports batch-wise boards)
  - `id` (uuid, primary key) - Unique leaderboard identifier
  - `name` (text) - Leaderboard name (e.g., "Batch 2024 Spring")
  - `description` (text) - Optional description
  - `public_id` (text, unique, indexed) - Unique shareable public identifier
  - `created_by` (uuid, foreign key) - Admin who created the board
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. student_records
  Stores individual student interview records
  - `id` (uuid, primary key) - Unique record identifier
  - `leaderboard_id` (uuid, foreign key) - Associated leaderboard
  - `student_name` (text) - Student's full name
  - `score` (integer) - Interview score (0-100)
  - `interview_date` (date) - Date of interview
  - `interviewer_name` (text) - Name of the interviewer
  - `strengths` (text) - Student's strengths noted during interview
  - `weaknesses` (text) - Areas for improvement
  - `feedback_summary` (text) - Brief feedback summary for leaderboard display
  - `additional_notes` (text) - Any additional comments
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Indexes
  - `public_id` on leaderboards table for fast public URL lookups
  - `leaderboard_id` on student_records for efficient filtering

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Admins can perform all operations on their own records
  - Public read-only access to leaderboards and student records via public_id
  - Authenticated admins have full CRUD access

  ## Important Notes
  1. All tables use `gen_random_uuid()` for automatic UUID generation
  2. Timestamps use `now()` for automatic timestamp generation
  3. Public IDs are generated using a random string function
  4. Foreign key constraints ensure data integrity
  5. Cascading deletes ensure cleanup when leaderboards are removed
*/

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create function to generate random public IDs
CREATE OR REPLACE FUNCTION generate_public_id()
RETURNS text AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  public_id text UNIQUE NOT NULL DEFAULT generate_public_id(),
  created_by uuid REFERENCES admins(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_leaderboards_public_id ON leaderboards(public_id);

-- Create student_records table
CREATE TABLE IF NOT EXISTS student_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id uuid NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  interview_date date NOT NULL,
  interviewer_name text NOT NULL,
  strengths text DEFAULT '',
  weaknesses text DEFAULT '',
  feedback_summary text NOT NULL,
  additional_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_student_records_leaderboard ON student_records(leaderboard_id);

-- RLS Policies for admins table
CREATE POLICY "Admins can read own profile"
  ON admins FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert own profile"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update own profile"
  ON admins FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for leaderboards table
CREATE POLICY "Authenticated admins can view all leaderboards"
  ON leaderboards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view leaderboards by public_id"
  ON leaderboards FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can create leaderboards"
  ON leaderboards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update own leaderboards"
  ON leaderboards FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can delete own leaderboards"
  ON leaderboards FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for student_records table
CREATE POLICY "Authenticated admins can view all student records"
  ON student_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = student_records.leaderboard_id
      AND leaderboards.created_by = auth.uid()
    )
  );

CREATE POLICY "Public can view student records from public leaderboards"
  ON student_records FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can create student records for own leaderboards"
  ON student_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = student_records.leaderboard_id
      AND leaderboards.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update student records in own leaderboards"
  ON student_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = student_records.leaderboard_id
      AND leaderboards.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = student_records.leaderboard_id
      AND leaderboards.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete student records from own leaderboards"
  ON student_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leaderboards
      WHERE leaderboards.id = student_records.leaderboard_id
      AND leaderboards.created_by = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaderboards_updated_at
  BEFORE UPDATE ON leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_records_updated_at
  BEFORE UPDATE ON student_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();