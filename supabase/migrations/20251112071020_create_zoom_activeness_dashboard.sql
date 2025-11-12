/*
  # Create Zoom Class Activeness Dashboard

  ## Overview
  This migration creates a completely separate system for tracking student activeness
  during live Zoom classes across 10 modules. This is independent from the interview
  leaderboard system.

  ## New Tables Created

  ### 1. activeness_boards
  Stores different activeness tracking boards (similar to leaderboards but separate).
  
  Structure:
  - `id` (uuid, primary key) - Unique board identifier
  - `name` (text) - Board name (e.g., "Batch 2025 - Zoom Activeness")
  - `description` (text) - Board description
  - `public_id` (text, unique) - Public shareable identifier
  - `created_by` (uuid, foreign key) - Admin who created the board
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. module_scores
  Stores activeness scores for each student per module.
  
  Structure:
  - `id` (uuid, primary key) - Unique score record identifier
  - `board_id` (uuid, foreign key) - Associated activeness board
  - `student_name` (text) - Student's name
  - `module_number` (integer) - Module number (1-10)
  - `activeness_score` (integer) - Activeness score (0-10)
  - `notes` (text) - Optional notes about student's participation
  - `recorded_date` (date) - Date when score was recorded
  - `created_at` (timestamptz) - When record was created
  - `updated_at` (timestamptz) - When record was last updated

  ## Calculated Metrics (done in application layer)
  
  For each student in a board:
  - Total Activeness Score: SUM(activeness_score) across all modules
  - Average Activeness: AVG(activeness_score) across completed modules
  - Modules Completed: COUNT(*) of modules with scores
  - Completion Percentage: (modules_completed / 10) * 100

  For the entire batch:
  - Total Students: COUNT(DISTINCT student_name)
  - Average Batch Activeness: AVG(activeness_score) across all scores
  - Total Modules Completed: SUM of all module completions
  - Most Active Student: Student with highest total score

  ## Indexes
  - Performance indexes on board_id, student_name, and module_number
  - Unique constraint on (board_id, student_name, module_number) to prevent duplicates

  ## Security
  - RLS enabled on all tables
  - Admins can only view/edit their own boards
  - Public can view via public_id (read-only)
*/

-- Create activeness_boards table
CREATE TABLE IF NOT EXISTS activeness_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  public_id text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_by uuid REFERENCES admins(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create module_scores table
CREATE TABLE IF NOT EXISTS module_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES activeness_boards(id) ON DELETE CASCADE NOT NULL,
  student_name text NOT NULL,
  module_number integer NOT NULL CHECK (module_number >= 1 AND module_number <= 10),
  activeness_score integer NOT NULL CHECK (activeness_score >= 0 AND activeness_score <= 10),
  notes text NOT NULL DEFAULT '',
  recorded_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(board_id, student_name, module_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activeness_boards_created_by ON activeness_boards(created_by);
CREATE INDEX IF NOT EXISTS idx_activeness_boards_public_id ON activeness_boards(public_id);
CREATE INDEX IF NOT EXISTS idx_module_scores_board_id ON module_scores(board_id);
CREATE INDEX IF NOT EXISTS idx_module_scores_student ON module_scores(board_id, student_name);
CREATE INDEX IF NOT EXISTS idx_module_scores_module ON module_scores(board_id, module_number);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_activeness_boards_updated_at
  BEFORE UPDATE ON activeness_boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_scores_updated_at
  BEFORE UPDATE ON module_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on activeness_boards
ALTER TABLE activeness_boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activeness_boards
CREATE POLICY "Authenticated admins can view their activeness boards"
  ON activeness_boards FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Public can view activeness boards"
  ON activeness_boards FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can create their own activeness boards"
  ON activeness_boards FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update their own activeness boards"
  ON activeness_boards FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can delete their own activeness boards"
  ON activeness_boards FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Enable RLS on module_scores
ALTER TABLE module_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for module_scores
CREATE POLICY "Authenticated admins can view scores in their boards"
  ON module_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activeness_boards
      WHERE activeness_boards.id = module_scores.board_id
      AND activeness_boards.created_by = auth.uid()
    )
  );

CREATE POLICY "Public can view module scores from public boards"
  ON module_scores FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can create scores in their boards"
  ON module_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activeness_boards
      WHERE activeness_boards.id = module_scores.board_id
      AND activeness_boards.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update scores in their boards"
  ON module_scores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activeness_boards
      WHERE activeness_boards.id = module_scores.board_id
      AND activeness_boards.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activeness_boards
      WHERE activeness_boards.id = module_scores.board_id
      AND activeness_boards.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete scores from their boards"
  ON module_scores FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activeness_boards
      WHERE activeness_boards.id = module_scores.board_id
      AND activeness_boards.created_by = auth.uid()
    )
  );
