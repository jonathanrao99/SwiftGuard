-- Fix Row Level Security policies for users table

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create RLS policies for users table

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to access all users (for admin operations)
CREATE POLICY "Service role can access all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view basic info of other users (for job matching, etc.)
-- This is more restrictive - only allow viewing users who are actively looking for jobs
CREATE POLICY "Users can view guard profiles" ON users
    FOR SELECT USING (
        auth.uid() != id AND 
        role = 'guard' AND 
        status = 'active'
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add function to check if user can access another user's profile
CREATE OR REPLACE FUNCTION can_access_user_profile(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow if it's the user's own profile
    IF auth.uid() = target_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Allow if user is active guard and requester is authenticated
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE id = target_user_id 
        AND role = 'guard' 
        AND status = 'active'
    ) AND auth.uid() IS NOT NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Allow service role access
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

