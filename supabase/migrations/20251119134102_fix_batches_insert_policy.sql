/*
  # Fix Batches Table INSERT Policy

  1. Problem
    - There are two INSERT policies on batches table
    - One policy checks "auth.uid() = created_by" which doesn't work for INSERTs
    - This causes batch creation to fail even for admins/editors

  2. Solution
    - Drop the problematic "Admins can create batches" policy
    - Keep only "Admins and Editors can insert batches" policy
    - This policy uses has_editor_or_admin_role() which works correctly

  3. Security
    - Only admins and editors can create batches
    - Viewers cannot create batches
    - No functionality removed, just fixing broken policy
*/

-- Remove the problematic policy that checks auth.uid() = created_by
DROP POLICY IF EXISTS "Admins can create batches" ON batches;

-- The correct policy "Admins and Editors can insert batches" remains active
-- It uses has_editor_or_admin_role() which properly checks user roles
