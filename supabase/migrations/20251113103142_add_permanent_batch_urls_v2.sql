/*
  # Add Permanent Batch URLs for Attendance

  1. Changes
    - Modify batch_public_urls to support permanent URLs
    - Add url_type column: 'temporary' (24hr) or 'permanent' (never expires)
    - Update RLS policies to handle permanent URLs
    - Make expires_at nullable for permanent URLs

  2. Notes
    - Temporary URLs expire after 24 hours (for daily attendance marking)
    - Permanent URLs never expire (for student dashboard viewing)
    - Each batch can have one permanent URL for student viewing
*/

-- Add url_type column to batch_public_urls
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'batch_public_urls' AND column_name = 'url_type'
  ) THEN
    -- Make expires_at nullable first
    ALTER TABLE batch_public_urls ALTER COLUMN expires_at DROP NOT NULL;
    
    -- Add url_type column without default first
    ALTER TABLE batch_public_urls ADD COLUMN url_type text;

    -- Update existing rows based on whether they have expires_at
    UPDATE batch_public_urls 
    SET url_type = CASE 
      WHEN expires_at IS NULL THEN 'permanent'
      ELSE 'temporary'
    END;
    
    -- Make url_type NOT NULL after setting values
    ALTER TABLE batch_public_urls ALTER COLUMN url_type SET NOT NULL;
    
    -- Set default for future inserts
    ALTER TABLE batch_public_urls ALTER COLUMN url_type SET DEFAULT 'temporary';

    -- Add check constraint for url_type
    ALTER TABLE batch_public_urls ADD CONSTRAINT check_url_type
      CHECK (url_type IN ('temporary', 'permanent'));

    -- Add check constraint: permanent URLs should have NULL expires_at
    ALTER TABLE batch_public_urls ADD CONSTRAINT check_permanent_url_expiry
      CHECK (
        (url_type = 'permanent' AND expires_at IS NULL) OR
        (url_type = 'temporary' AND expires_at IS NOT NULL)
      );
  END IF;
END $$;

-- Update RLS policy for public viewing to handle permanent URLs
DROP POLICY IF EXISTS "Public can view active batch URLs" ON batch_public_urls;

CREATE POLICY "Public can view active batch URLs"
  ON batch_public_urls FOR SELECT
  TO anon
  USING (
    is_active = true AND
    (url_type = 'permanent' OR (url_type = 'temporary' AND expires_at > now()))
  );

-- Update policy for batches to handle permanent URLs
DROP POLICY IF EXISTS "Public can view batches via valid public URL" ON batches;

CREATE POLICY "Public can view batches via valid public URL"
  ON batches FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM batch_public_urls
      WHERE batch_public_urls.batch_id = batches.id
      AND batch_public_urls.is_active = true
      AND (
        batch_public_urls.url_type = 'permanent' OR
        (batch_public_urls.url_type = 'temporary' AND batch_public_urls.expires_at > now())
      )
    )
  );

-- Update policy for batch students
DROP POLICY IF EXISTS "Public can view batch students via valid public URL" ON batch_students;

CREATE POLICY "Public can view batch students via valid public URL"
  ON batch_students FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM batch_public_urls
      WHERE batch_public_urls.batch_id = batch_students.batch_id
      AND batch_public_urls.is_active = true
      AND (
        batch_public_urls.url_type = 'permanent' OR
        (batch_public_urls.url_type = 'temporary' AND batch_public_urls.expires_at > now())
      )
    )
  );

-- Update policy for attendance sessions
DROP POLICY IF EXISTS "Public can view attendance sessions via batch public URL" ON attendance_sessions;

CREATE POLICY "Public can view attendance sessions via batch public URL"
  ON attendance_sessions FOR SELECT
  TO anon
  USING (
    batch_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM batch_public_urls
      WHERE batch_public_urls.batch_id = attendance_sessions.batch_id
      AND batch_public_urls.is_active = true
      AND (
        batch_public_urls.url_type = 'permanent' OR
        (batch_public_urls.url_type = 'temporary' AND batch_public_urls.expires_at > now())
      )
    )
  );

-- Update policy for attendance records
DROP POLICY IF EXISTS "Public can view attendance records via batch public URL" ON attendance_records;

CREATE POLICY "Public can view attendance records via batch public URL"
  ON attendance_records FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions ats
      INNER JOIN batch_public_urls bpu ON bpu.batch_id = ats.batch_id
      WHERE ats.id = attendance_records.session_id
      AND bpu.is_active = true
      AND (
        bpu.url_type = 'permanent' OR
        (bpu.url_type = 'temporary' AND bpu.expires_at > now())
      )
    )
  );

-- Add index for url_type
CREATE INDEX IF NOT EXISTS idx_batch_public_urls_url_type ON batch_public_urls(url_type);
