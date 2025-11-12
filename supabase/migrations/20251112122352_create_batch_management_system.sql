/*
  # Create Batch Management System

  1. New Tables
    - `batches`
      - `id` (uuid, primary key)
      - `name` (text) - Batch name (e.g., Batch A, Morning Batch)
      - `description` (text) - Optional description
      - `is_active` (boolean) - Whether batch is active
      - `created_by` (uuid) - Admin who created it
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `batch_students`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key to batches)
      - `student_name` (text) - Student name
      - `student_email` (text) - Optional email
      - `created_at` (timestamptz)
      - Unique constraint on (batch_id, student_name)
  
  2. Changes to existing tables
    - Add `batch_id` to `attendance_sessions` (nullable for backward compatibility)
    - This links sessions to specific batches
  
  3. Security
    - Enable RLS on all new tables
    - Admins can manage batches and students
    - Public can view active batches via public URLs
*/

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create batch_students table
CREATE TABLE IF NOT EXISTS batch_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  student_name text NOT NULL,
  student_email text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(batch_id, student_name)
);

-- Add batch_id to attendance_sessions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_sessions' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE attendance_sessions ADD COLUMN batch_id uuid REFERENCES batches(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_students ENABLE ROW LEVEL SECURITY;

-- Policies for batches
CREATE POLICY "Admins can view all batches"
  ON batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create batches"
  ON batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their batches"
  ON batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can delete their batches"
  ON batches FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Public can view active batches"
  ON batches FOR SELECT
  TO anon
  USING (is_active = true);

-- Policies for batch_students
CREATE POLICY "Admins can view all batch students"
  ON batch_students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can add students to batches"
  ON batch_students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_id
      AND batches.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update batch students"
  ON batch_students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_id
      AND batches.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_id
      AND batches.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete batch students"
  ON batch_students FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_id
      AND batches.created_by = auth.uid()
    )
  );

CREATE POLICY "Public can view students from active batches"
  ON batch_students FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_id
      AND batches.is_active = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_batches_created_by ON batches(created_by);
CREATE INDEX IF NOT EXISTS idx_batches_is_active ON batches(is_active);
CREATE INDEX IF NOT EXISTS idx_batch_students_batch_id ON batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_batch_id ON attendance_sessions(batch_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_batches_updated_at_trigger ON batches;
CREATE TRIGGER update_batches_updated_at_trigger
  BEFORE UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION update_batches_updated_at();
