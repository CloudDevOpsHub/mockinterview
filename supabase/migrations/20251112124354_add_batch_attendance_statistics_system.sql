/*
  # Batch Attendance Statistics System
  
  1. New Tables
    - `batch_public_urls`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key to batches)
      - `public_id` (text, unique) - Unique identifier for public URL
      - `is_active` (boolean) - Whether URL is active
      - `expires_at` (timestamptz) - 24-hour expiration
      - `created_by` (uuid) - Admin who created it
      - `created_at` (timestamptz)
      - `last_accessed_at` (timestamptz) - Track when URL was last viewed
  
  2. Views
    - Create a view for batch attendance statistics that calculates:
      - Total sessions for each batch
      - Per-student attendance counts (present/absent/total)
      - Attendance percentage per student
  
  3. Functions
    - Function to get batch attendance statistics
    - Function to calculate student attendance summary
  
  4. Security
    - Enable RLS on batch_public_urls table
    - Allow public access to statistics via valid public_id
    - Admin can create and manage public URLs
*/

-- Create batch_public_urls table
CREATE TABLE IF NOT EXISTS batch_public_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  public_id text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_public_urls_batch_id ON batch_public_urls(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_public_urls_public_id ON batch_public_urls(public_id);
CREATE INDEX IF NOT EXISTS idx_batch_public_urls_expires_at ON batch_public_urls(expires_at);

-- Enable RLS
ALTER TABLE batch_public_urls ENABLE ROW LEVEL SECURITY;

-- Policies for batch_public_urls
CREATE POLICY "Admins can view all batch public URLs"
  ON batch_public_urls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create batch public URLs"
  ON batch_public_urls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update batch public URLs"
  ON batch_public_urls FOR UPDATE
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

CREATE POLICY "Admins can delete batch public URLs"
  ON batch_public_urls FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_id
      AND batches.created_by = auth.uid()
    )
  );

CREATE POLICY "Public can view active batch URLs"
  ON batch_public_urls FOR SELECT
  TO anon
  USING (is_active = true AND expires_at > now());

-- Function to calculate batch attendance statistics
CREATE OR REPLACE FUNCTION get_batch_attendance_stats(p_batch_id uuid)
RETURNS TABLE (
  student_name text,
  student_email text,
  total_sessions bigint,
  sessions_present bigint,
  sessions_absent bigint,
  attendance_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH batch_sessions AS (
    SELECT id
    FROM attendance_sessions
    WHERE batch_id = p_batch_id
  ),
  total_sessions_count AS (
    SELECT COUNT(*) as total
    FROM batch_sessions
  ),
  student_attendance AS (
    SELECT 
      bs.student_name,
      bs.student_email,
      COUNT(DISTINCT ar.session_id) as sessions_attended
    FROM batch_students bs
    LEFT JOIN attendance_records ar 
      ON ar.student_name = bs.student_name 
      AND ar.session_id IN (SELECT id FROM batch_sessions)
    WHERE bs.batch_id = p_batch_id
    GROUP BY bs.student_name, bs.student_email
  )
  SELECT 
    sa.student_name,
    sa.student_email,
    tsc.total as total_sessions,
    sa.sessions_attended as sessions_present,
    (tsc.total - sa.sessions_attended) as sessions_absent,
    CASE 
      WHEN tsc.total > 0 THEN ROUND((sa.sessions_attended::numeric / tsc.total::numeric) * 100, 2)
      ELSE 0
    END as attendance_percentage
  FROM student_attendance sa
  CROSS JOIN total_sessions_count tsc
  ORDER BY sa.student_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get batch overview statistics
CREATE OR REPLACE FUNCTION get_batch_overview(p_batch_id uuid)
RETURNS TABLE (
  batch_name text,
  batch_description text,
  total_students bigint,
  total_sessions bigint,
  average_attendance_percentage numeric,
  last_session_date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.name as batch_name,
    b.description as batch_description,
    (SELECT COUNT(*) FROM batch_students WHERE batch_id = p_batch_id) as total_students,
    (SELECT COUNT(*) FROM attendance_sessions WHERE batch_id = p_batch_id) as total_sessions,
    COALESCE(
      (SELECT AVG(
        CASE 
          WHEN total_sessions > 0 
          THEN (sessions_present::numeric / total_sessions::numeric) * 100
          ELSE 0
        END
      )
      FROM get_batch_attendance_stats(p_batch_id)),
      0
    ) as average_attendance_percentage,
    (SELECT MAX(session_date) FROM attendance_sessions WHERE batch_id = p_batch_id) as last_session_date
  FROM batches b
  WHERE b.id = p_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get students who attended a specific session
CREATE OR REPLACE FUNCTION get_session_attendance_by_batch(p_session_id uuid)
RETURNS TABLE (
  student_name text,
  student_email text,
  is_present boolean
) AS $$
DECLARE
  v_batch_id uuid;
BEGIN
  -- Get the batch_id for this session
  SELECT batch_id INTO v_batch_id
  FROM attendance_sessions
  WHERE id = p_session_id;
  
  IF v_batch_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    bs.student_name,
    bs.student_email,
    EXISTS(
      SELECT 1 FROM attendance_records ar
      WHERE ar.session_id = p_session_id
      AND ar.student_name = bs.student_name
    ) as is_present
  FROM batch_students bs
  WHERE bs.batch_id = v_batch_id
  ORDER BY bs.student_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire old batch public URLs
CREATE OR REPLACE FUNCTION expire_old_batch_public_urls()
RETURNS void AS $$
BEGIN
  UPDATE batch_public_urls
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy to allow public to view batch details via valid public URL
CREATE POLICY "Public can view batches via valid public URL"
  ON batches FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM batch_public_urls
      WHERE batch_public_urls.batch_id = batches.id
      AND batch_public_urls.is_active = true
      AND batch_public_urls.expires_at > now()
    )
  );

-- Add RLS policy to allow public to view batch students via valid public URL
CREATE POLICY "Public can view batch students via valid public URL"
  ON batch_students FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM batch_public_urls
      WHERE batch_public_urls.batch_id = batch_students.batch_id
      AND batch_public_urls.is_active = true
      AND batch_public_urls.expires_at > now()
    )
  );

-- Add RLS policy to allow public to view attendance sessions via batch public URL
CREATE POLICY "Public can view attendance sessions via batch public URL"
  ON attendance_sessions FOR SELECT
  TO anon
  USING (
    batch_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM batch_public_urls
      WHERE batch_public_urls.batch_id = attendance_sessions.batch_id
      AND batch_public_urls.is_active = true
      AND batch_public_urls.expires_at > now()
    )
  );

-- Add RLS policy to allow public to view attendance records via batch public URL
CREATE POLICY "Public can view attendance records via batch public URL"
  ON attendance_records FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions ats
      INNER JOIN batch_public_urls bpu ON bpu.batch_id = ats.batch_id
      WHERE ats.id = attendance_records.session_id
      AND bpu.is_active = true
      AND bpu.expires_at > now()
    )
  );
