/*
  # Add INSERT Policy for Authenticated Users on Attendance Records

  1. Problem
    - Only anonymous users can INSERT attendance records
    - Authenticated users (admins/editors) cannot mark attendance
    - When logged in, marking attendance fails with RLS violation

  2. Solution
    - Add INSERT policy for authenticated users
    - Use the same validation function as anonymous users
    - Allows admins to test attendance marking while logged in

  3. Security
    - Both authenticated and anonymous users can mark attendance
    - Can only mark for active sessions (validated by function)
    - Cannot view, update, or delete without proper role permissions
*/

-- Add INSERT policy for authenticated users to mark attendance
CREATE POLICY "Authenticated users can mark attendance for active sessions"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (can_mark_attendance_for_session(session_id));
