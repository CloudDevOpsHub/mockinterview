/*
  # Fix Batches Creation Issue

  1. Changes
    - Set default value for created_by column to auth.uid()
    - This ensures batch creation works without explicitly passing created_by
  
  2. Security
    - Maintains RLS policies
    - Automatically tracks who created each batch
*/

-- Set default value for created_by to automatically use the authenticated user's ID
ALTER TABLE batches 
ALTER COLUMN created_by SET DEFAULT auth.uid();
