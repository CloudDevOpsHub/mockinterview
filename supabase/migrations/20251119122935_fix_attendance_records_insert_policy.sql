/*
  # Fix Attendance Records Insert Policy

  1. Changes
    - Update the INSERT policy for attendance_records to handle sessions without expires_at
    - Allow inserting records for active sessions regardless of expiration

  2. Security
    - Still requires session to be active
    - Validates session exists
*/

-- Drop and recreate the INSERT policy for attendance_records
DROP POLICY IF EXISTS "Anyone can mark attendance for active sessions" ON attendance_records;

CREATE POLICY "Anyone can mark attendance for active sessions"
  ON attendance_records FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE attendance_sessions.id = session_id
      AND attendance_sessions.is_active = true
      AND (attendance_sessions.expires_at IS NULL OR attendance_sessions.expires_at > now())
    )
  );
