/*
  # Fix Attendance Records Insert Policy with Security Definer Function

  1. Changes
    - Create a SECURITY DEFINER function to check if a session allows attendance marking
    - Update INSERT policy to use this function
    - This bypasses RLS checks in the policy evaluation

  2. Security
    - Function validates session is active and not expired
    - Policy still restricts to anonymous users only
*/

-- Create a function to check if attendance can be marked for a session
CREATE OR REPLACE FUNCTION can_mark_attendance_for_session(p_session_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM attendance_sessions
    WHERE id = p_session_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the INSERT policy using the function
DROP POLICY IF EXISTS "Anyone can mark attendance for active sessions" ON attendance_records;

CREATE POLICY "Anyone can mark attendance for active sessions"
  ON attendance_records FOR INSERT
  TO anon
  WITH CHECK (can_mark_attendance_for_session(session_id));
