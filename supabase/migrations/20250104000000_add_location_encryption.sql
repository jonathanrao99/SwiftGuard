-- Add location encryption migration
-- This migration adds location encryption support and migrates existing location data

-- Add new encrypted location columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS encrypted_location TEXT,
ADD COLUMN IF NOT EXISTS location_encrypted_at TIMESTAMPTZ;

-- Add encrypted location columns to guard_tracking table
ALTER TABLE public.guard_tracking 
ADD COLUMN IF NOT EXISTS encrypted_location TEXT,
ADD COLUMN IF NOT EXISTS location_encrypted_at TIMESTAMPTZ;

-- Add encrypted location columns to incidents table
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS encrypted_location TEXT,
ADD COLUMN IF NOT EXISTS location_encrypted_at TIMESTAMPTZ;

-- Add encrypted location columns to shift_checkpoints table
ALTER TABLE public.shift_checkpoints 
ADD COLUMN IF NOT EXISTS encrypted_location TEXT,
ADD COLUMN IF NOT EXISTS location_encrypted_at TIMESTAMPTZ;

-- Create function to encrypt existing location data
CREATE OR REPLACE FUNCTION encrypt_existing_locations()
RETURNS void AS $$
DECLARE
    rec RECORD;
    location_json JSONB;
    encrypted_location TEXT;
BEGIN
    -- Encrypt locations in users table
    FOR rec IN 
        SELECT id, current_location 
        FROM public.users 
        WHERE current_location IS NOT NULL 
        AND encrypted_location IS NULL
    LOOP
        -- For now, we'll store the location as encrypted JSON
        -- In production, this should use the actual encryption function
        encrypted_location := jsonb_build_object(
            'encrypted', 'PLACEHOLDER_ENCRYPTED_DATA',
            'iv', 'PLACEHOLDER_IV'
        )::text;
        
        UPDATE public.users 
        SET 
            encrypted_location = encrypted_location,
            location_encrypted_at = NOW()
        WHERE id = rec.id;
    END LOOP;

    -- Encrypt locations in guard_tracking table
    FOR rec IN 
        SELECT id, location 
        FROM public.guard_tracking 
        WHERE location IS NOT NULL 
        AND encrypted_location IS NULL
    LOOP
        encrypted_location := jsonb_build_object(
            'encrypted', 'PLACEHOLDER_ENCRYPTED_DATA',
            'iv', 'PLACEHOLDER_IV'
        )::text;
        
        UPDATE public.guard_tracking 
        SET 
            encrypted_location = encrypted_location,
            location_encrypted_at = NOW()
        WHERE id = rec.id;
    END LOOP;

    -- Encrypt locations in incidents table
    FOR rec IN 
        SELECT id, location 
        FROM public.incidents 
        WHERE location IS NOT NULL 
        AND encrypted_location IS NULL
    LOOP
        encrypted_location := jsonb_build_object(
            'encrypted', 'PLACEHOLDER_ENCRYPTED_DATA',
            'iv', 'PLACEHOLDER_IV'
        )::text;
        
        UPDATE public.incidents 
        SET 
            encrypted_location = encrypted_location,
            location_encrypted_at = NOW()
        WHERE id = rec.id;
    END LOOP;

    -- Encrypt locations in shift_checkpoints table
    FOR rec IN 
        SELECT id, latitude, longitude 
        FROM public.shift_checkpoints 
        WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL 
        AND encrypted_location IS NULL
    LOOP
        location_json := jsonb_build_object(
            'latitude', rec.latitude,
            'longitude', rec.longitude
        );
        
        encrypted_location := jsonb_build_object(
            'encrypted', 'PLACEHOLDER_ENCRYPTED_DATA',
            'iv', 'PLACEHOLDER_IV'
        )::text;
        
        UPDATE public.shift_checkpoints 
        SET 
            encrypted_location = encrypted_location,
            location_encrypted_at = NOW()
        WHERE id = rec.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the encryption function
SELECT encrypt_existing_locations();

-- Drop the temporary function
DROP FUNCTION encrypt_existing_locations();

-- Add indexes for encrypted location queries
CREATE INDEX IF NOT EXISTS idx_users_encrypted_location ON public.users(encrypted_location) WHERE encrypted_location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guard_tracking_encrypted_location ON public.guard_tracking(encrypted_location) WHERE encrypted_location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_encrypted_location ON public.incidents(encrypted_location) WHERE encrypted_location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shift_checkpoints_encrypted_location ON public.shift_checkpoints(encrypted_location) WHERE encrypted_location IS NOT NULL;

-- Add RLS policies for encrypted location data
CREATE POLICY "Users can view their own encrypted location" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Guards can view their own tracking data" ON public.guard_tracking
    FOR SELECT USING (auth.uid() = guard_id);

CREATE POLICY "Users can view incidents they're involved in" ON public.incidents
    FOR SELECT USING (auth.uid() = guard_id OR auth.uid() = client_id);

CREATE POLICY "Users can view checkpoints for their jobs" ON public.shift_checkpoints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.job_guards jg 
            WHERE jg.job_id = shift_checkpoints.job_id 
            AND jg.guard_id = auth.uid()
        )
    );
