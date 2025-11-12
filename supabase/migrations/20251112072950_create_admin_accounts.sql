/*
  # Create 10 Pre-configured Admin Accounts

  ## Overview
  Creates 10 admin user accounts with standardized credentials for easy access.
  These accounts are created in both auth.users and the admins table.

  ## Admin Accounts Created
  
  Email addresses: admin1@example.com through admin10@example.com
  Password: Admin@123 (for all accounts)
  Names: Admin 1 through Admin 10

  ## Security Notes
  
  - All accounts use the same password for simplicity
  - Password is securely hashed by Supabase Auth
  - Admins should change their passwords after first login
  - Each admin can only see their own boards due to RLS policies

  ## Implementation
  
  Uses Supabase's auth.users table directly to create accounts.
  Also creates corresponding entries in the admins table for profile data.
*/

-- Create 10 admin users with pre-configured credentials
-- Password: Admin@123

DO $$
DECLARE
  admin_id uuid;
  admin_email text;
  admin_name text;
  i integer;
BEGIN
  FOR i IN 1..10 LOOP
    admin_email := 'admin' || i || '@example.com';
    admin_name := 'Admin ' || i;
    
    -- Check if user already exists
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    -- Only create if doesn't exist
    IF admin_id IS NULL THEN
      -- Generate a UUID for the new user
      admin_id := gen_random_uuid();
      
      -- Insert into auth.users
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role
      ) VALUES (
        admin_id,
        '00000000-0000-0000-0000-000000000000',
        admin_email,
        crypt('Admin@123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', admin_name),
        'authenticated',
        'authenticated'
      );
      
      -- Insert into admins table
      INSERT INTO admins (id, email, name, created_at)
      VALUES (admin_id, admin_email, admin_name, now())
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
