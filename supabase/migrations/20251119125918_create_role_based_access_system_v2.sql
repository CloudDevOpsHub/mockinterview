/*
  # Create Role-Based Access Control System

  1. New Tables
    - `user_roles` - Defines available roles in the system

  2. Changes to Existing Tables
    - Add `role` column to `admins` table with default 'admin'
    - Add `created_by` column to track who created each admin user

  3. Role Types
    - `admin` - Full access: create, read, update, delete + user management
    - `editor` - Write access: create, read, update (no delete, no user management)
    - `viewer` - Read-only access: read only (no create, update, delete, or user management)

  4. Security
    - Update RLS policies to enforce role-based permissions
    - Only admins can create new users
    - Only admins can delete records
    - Editors can create and update but not delete
    - Viewers can only read data

  5. Notes
    - Existing admin users will be assigned 'admin' role by default
    - Role column uses CHECK constraint to ensure valid roles
*/

-- Create user_roles reference table
CREATE TABLE IF NOT EXISTS user_roles (
  role_name text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert role definitions
INSERT INTO user_roles (role_name, description) VALUES
  ('admin', 'Full access: create, read, update, delete, and user management'),
  ('editor', 'Write access: create, read, and update (no delete or user management)'),
  ('viewer', 'Read-only access: view data only')
ON CONFLICT (role_name) DO NOTHING;

-- Add role and created_by columns to admins table
DO $$
BEGIN
  -- Add role column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'role'
  ) THEN
    ALTER TABLE admins ADD COLUMN role text DEFAULT 'admin';
    ALTER TABLE admins ADD CONSTRAINT admins_role_check 
      CHECK (role IN ('admin', 'editor', 'viewer'));
    
    -- Update existing admins to have admin role
    UPDATE admins SET role = 'admin' WHERE role IS NULL;
    
    -- Make role NOT NULL after setting defaults
    ALTER TABLE admins ALTER COLUMN role SET NOT NULL;
  END IF;

  -- Add created_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE admins ADD COLUMN created_by uuid REFERENCES admins(id);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read roles
CREATE POLICY "All authenticated users can view roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM admins
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_admin_role()
RETURNS boolean AS $$
BEGIN
  RETURN has_role('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_editor_or_admin_role()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE id = auth.uid()
    AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate policies for admins table
DROP POLICY IF EXISTS "Authenticated users can view their own admin record" ON admins;
DROP POLICY IF EXISTS "Admins can view all admin records" ON admins;
DROP POLICY IF EXISTS "Admins can create admin users" ON admins;
DROP POLICY IF EXISTS "Admins can update their own record" ON admins;

CREATE POLICY "All authenticated admins can view all admin records"
  ON admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Only admins can create new admin users"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (has_admin_role());

CREATE POLICY "Only admins can update admin records"
  ON admins FOR UPDATE
  TO authenticated
  USING (has_admin_role())
  WITH CHECK (has_admin_role());

CREATE POLICY "Only admins can delete admin records"
  ON admins FOR DELETE
  TO authenticated
  USING (has_admin_role());

-- Update leaderboards policies
DROP POLICY IF EXISTS "Admins can view all leaderboards" ON leaderboards;
DROP POLICY IF EXISTS "Admins can insert leaderboards" ON leaderboards;
DROP POLICY IF EXISTS "Admins can update leaderboards" ON leaderboards;
DROP POLICY IF EXISTS "Admins can delete leaderboards" ON leaderboards;

CREATE POLICY "All users can view leaderboards"
  ON leaderboards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins and Editors can insert leaderboards"
  ON leaderboards FOR INSERT
  TO authenticated
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Admins and Editors can update leaderboards"
  ON leaderboards FOR UPDATE
  TO authenticated
  USING (has_editor_or_admin_role())
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Only Admins can delete leaderboards"
  ON leaderboards FOR DELETE
  TO authenticated
  USING (has_admin_role());

-- Update interview_rounds policies
DROP POLICY IF EXISTS "Admins can view all interview rounds" ON interview_rounds;
DROP POLICY IF EXISTS "All admins can insert interview rounds" ON interview_rounds;
DROP POLICY IF EXISTS "Admins can update interview rounds" ON interview_rounds;
DROP POLICY IF EXISTS "Admins can delete interview rounds" ON interview_rounds;

CREATE POLICY "All users can view interview rounds"
  ON interview_rounds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins and Editors can insert interview rounds"
  ON interview_rounds FOR INSERT
  TO authenticated
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Admins and Editors can update interview rounds"
  ON interview_rounds FOR UPDATE
  TO authenticated
  USING (has_editor_or_admin_role())
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Only Admins can delete interview rounds"
  ON interview_rounds FOR DELETE
  TO authenticated
  USING (has_admin_role());

-- Update module_scores policies
DROP POLICY IF EXISTS "Admins can view all module scores" ON module_scores;
DROP POLICY IF EXISTS "Admins can insert module scores" ON module_scores;
DROP POLICY IF EXISTS "Admins can update module scores" ON module_scores;
DROP POLICY IF EXISTS "Admins can delete module scores" ON module_scores;

CREATE POLICY "All users can view module scores"
  ON module_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins and Editors can insert module scores"
  ON module_scores FOR INSERT
  TO authenticated
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Admins and Editors can update module scores"
  ON module_scores FOR UPDATE
  TO authenticated
  USING (has_editor_or_admin_role())
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Only Admins can delete module scores"
  ON module_scores FOR DELETE
  TO authenticated
  USING (has_admin_role());

-- Update activeness_boards policies
DROP POLICY IF EXISTS "Admins can view all activeness boards" ON activeness_boards;
DROP POLICY IF EXISTS "Admins can insert activeness boards" ON activeness_boards;
DROP POLICY IF EXISTS "Admins can update activeness boards" ON activeness_boards;
DROP POLICY IF EXISTS "Admins can delete activeness boards" ON activeness_boards;

CREATE POLICY "All users can view activeness boards"
  ON activeness_boards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins and Editors can insert activeness boards"
  ON activeness_boards FOR INSERT
  TO authenticated
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Admins and Editors can update activeness boards"
  ON activeness_boards FOR UPDATE
  TO authenticated
  USING (has_editor_or_admin_role())
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Only Admins can delete activeness boards"
  ON activeness_boards FOR DELETE
  TO authenticated
  USING (has_admin_role());

-- Update batches policies
DROP POLICY IF EXISTS "Admins can view all batches" ON batches;
DROP POLICY IF EXISTS "Admins can insert batches" ON batches;
DROP POLICY IF EXISTS "Admins can update batches" ON batches;
DROP POLICY IF EXISTS "Admins can delete batches" ON batches;

CREATE POLICY "All users can view batches"
  ON batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins and Editors can insert batches"
  ON batches FOR INSERT
  TO authenticated
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Admins and Editors can update batches"
  ON batches FOR UPDATE
  TO authenticated
  USING (has_editor_or_admin_role())
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Only Admins can delete batches"
  ON batches FOR DELETE
  TO authenticated
  USING (has_admin_role());

-- Update attendance_sessions policies
DROP POLICY IF EXISTS "Admins can view all attendance sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Admins can insert attendance sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Admins can update attendance sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Admins can delete attendance sessions" ON attendance_sessions;

CREATE POLICY "All users can view attendance sessions"
  ON attendance_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins and Editors can insert attendance sessions"
  ON attendance_sessions FOR INSERT
  TO authenticated
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Admins and Editors can update attendance sessions"
  ON attendance_sessions FOR UPDATE
  TO authenticated
  USING (has_editor_or_admin_role())
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Only Admins can delete attendance sessions"
  ON attendance_sessions FOR DELETE
  TO authenticated
  USING (has_admin_role());

-- Update attendance_records policies
DROP POLICY IF EXISTS "Admins can view all attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Admins can update attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Admins can delete attendance records" ON attendance_records;

CREATE POLICY "All users can view attendance records"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins and Editors can update attendance records"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (has_editor_or_admin_role())
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Only Admins can delete attendance records"
  ON attendance_records FOR DELETE
  TO authenticated
  USING (has_admin_role());

-- Update batch_public_urls policies
DROP POLICY IF EXISTS "Admins can view all batch public URLs" ON batch_public_urls;
DROP POLICY IF EXISTS "Admins can insert batch public URLs" ON batch_public_urls;
DROP POLICY IF EXISTS "Admins can update batch public URLs" ON batch_public_urls;
DROP POLICY IF EXISTS "Admins can delete batch public URLs" ON batch_public_urls;

CREATE POLICY "All users can view batch public URLs"
  ON batch_public_urls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins and Editors can insert batch public URLs"
  ON batch_public_urls FOR INSERT
  TO authenticated
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Admins and Editors can update batch public URLs"
  ON batch_public_urls FOR UPDATE
  TO authenticated
  USING (has_editor_or_admin_role())
  WITH CHECK (has_editor_or_admin_role());

CREATE POLICY "Only Admins can delete batch public URLs"
  ON batch_public_urls FOR DELETE
  TO authenticated
  USING (has_admin_role());
