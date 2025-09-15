-- SwiftGuard Privacy Request Tables
-- Supports GDPR/CCPA data subject requests

-- Create privacy requests table
CREATE TABLE IF NOT EXISTS public.privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('export_my_data', 'delete_my_data', 'rectify_my_data', 'restrict_processing')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    reason TEXT,
    specific_data TEXT[],
    contact_method TEXT CHECK (contact_method IN ('email', 'phone')),
    urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    grace_period_ends TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data exports table
CREATE TABLE IF NOT EXISTS public.data_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.privacy_requests(id) ON DELETE CASCADE,
    export_data JSONB NOT NULL,
    file_path TEXT,
    file_size_bytes BIGINT,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 3,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create processing restrictions table
CREATE TABLE IF NOT EXISTS public.processing_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    restriction_type TEXT NOT NULL CHECK (restriction_type IN ('marketing', 'analytics', 'all')),
    reason TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    applied_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add processing restriction columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS processing_restricted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS processing_restriction_reason TEXT,
ADD COLUMN IF NOT EXISTS processing_restricted_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_privacy_requests_user_id ON public.privacy_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON public.privacy_requests (status);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_action ON public.privacy_requests (action);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_requested_at ON public.privacy_requests (requested_at);

CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON public.data_exports (user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_expires_at ON public.data_exports (expires_at);
CREATE INDEX IF NOT EXISTS idx_data_exports_request_id ON public.data_exports (request_id);

CREATE INDEX IF NOT EXISTS idx_processing_restrictions_user_id ON public.processing_restrictions (user_id);
CREATE INDEX IF NOT EXISTS idx_processing_restrictions_is_active ON public.processing_restrictions (is_active);
CREATE INDEX IF NOT EXISTS idx_processing_restrictions_expires_at ON public.processing_restrictions (expires_at);

-- Enable RLS on all tables
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_restrictions ENABLE ROW LEVEL SECURITY;

-- RLS policies for privacy_requests
CREATE POLICY "Users can view own privacy requests" ON public.privacy_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own privacy requests" ON public.privacy_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all privacy requests" ON public.privacy_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update privacy requests" ON public.privacy_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for data_exports
CREATE POLICY "Users can view own data exports" ON public.data_exports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own data exports" ON public.data_exports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all data exports" ON public.data_exports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for processing_restrictions
CREATE POLICY "Users can view own processing restrictions" ON public.processing_restrictions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own processing restrictions" ON public.processing_restrictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all processing restrictions" ON public.processing_restrictions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to create privacy request
CREATE OR REPLACE FUNCTION public.create_privacy_request(
    p_user_id UUID,
    p_action TEXT,
    p_reason TEXT DEFAULT NULL,
    p_specific_data TEXT[] DEFAULT NULL,
    p_contact_method TEXT DEFAULT NULL,
    p_urgency TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    request_id UUID;
BEGIN
    INSERT INTO public.privacy_requests (
        user_id,
        action,
        reason,
        specific_data,
        contact_method,
        urgency
    ) VALUES (
        p_user_id,
        p_action,
        p_reason,
        p_specific_data,
        p_contact_method,
        p_urgency
    ) RETURNING id INTO request_id;
    
    RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update privacy request status
CREATE OR REPLACE FUNCTION public.update_privacy_request_status(
    p_request_id UUID,
    p_status TEXT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.privacy_requests 
    SET 
        status = p_status,
        admin_notes = p_admin_notes,
        updated_at = NOW(),
        processed_at = CASE WHEN p_status = 'processing' THEN NOW() ELSE processed_at END,
        completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE completed_at END
    WHERE id = p_request_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create data export
CREATE OR REPLACE FUNCTION public.create_data_export(
    p_user_id UUID,
    p_request_id UUID,
    p_export_data JSONB,
    p_file_path TEXT DEFAULT NULL,
    p_file_size_bytes BIGINT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    export_id UUID;
BEGIN
    INSERT INTO public.data_exports (
        user_id,
        request_id,
        export_data,
        file_path,
        file_size_bytes,
        expires_at
    ) VALUES (
        p_user_id,
        p_request_id,
        p_export_data,
        p_file_path,
        p_file_size_bytes,
        NOW() + INTERVAL '30 days'
    ) RETURNING id INTO export_id;
    
    RETURN export_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track data export download
CREATE OR REPLACE FUNCTION public.track_data_export_download(
    p_export_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.data_exports 
    SET 
        download_count = download_count + 1,
        accessed_at = NOW()
    WHERE id = p_export_id
    AND download_count < max_downloads
    AND expires_at > NOW();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create processing restriction
CREATE OR REPLACE FUNCTION public.create_processing_restriction(
    p_user_id UUID,
    p_restriction_type TEXT,
    p_reason TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    restriction_id UUID;
BEGIN
    INSERT INTO public.processing_restrictions (
        user_id,
        restriction_type,
        reason,
        expires_at
    ) VALUES (
        p_user_id,
        p_restriction_type,
        p_reason,
        p_expires_at
    ) RETURNING id INTO restriction_id;
    
    -- Update user table
    UPDATE public.users 
    SET 
        processing_restricted = true,
        processing_restriction_reason = p_reason,
        processing_restricted_at = NOW()
    WHERE id = p_user_id;
    
    RETURN restriction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove processing restriction
CREATE OR REPLACE FUNCTION public.remove_processing_restriction(
    p_user_id UUID,
    p_restriction_type TEXT DEFAULT 'all'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update processing restrictions table
    UPDATE public.processing_restrictions 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND restriction_type = p_restriction_type
    AND is_active = true;
    
    -- Check if user has any active restrictions
    IF NOT EXISTS (
        SELECT 1 FROM public.processing_restrictions 
        WHERE user_id = p_user_id 
        AND is_active = true
    ) THEN
        -- Remove restriction from user table
        UPDATE public.users 
        SET 
            processing_restricted = false,
            processing_restriction_reason = NULL,
            processing_restricted_at = NULL
        WHERE id = p_user_id;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user privacy summary
CREATE OR REPLACE FUNCTION public.get_user_privacy_summary(p_user_id UUID)
RETURNS TABLE(
    total_requests INTEGER,
    pending_requests INTEGER,
    completed_requests INTEGER,
    active_restrictions INTEGER,
    data_exports_count INTEGER,
    last_request_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(pr.id)::INTEGER as total_requests,
        COUNT(CASE WHEN pr.status = 'pending' THEN 1 END)::INTEGER as pending_requests,
        COUNT(CASE WHEN pr.status = 'completed' THEN 1 END)::INTEGER as completed_requests,
        COUNT(CASE WHEN pres.is_active = true THEN 1 END)::INTEGER as active_restrictions,
        COUNT(de.id)::INTEGER as data_exports_count,
        MAX(pr.requested_at) as last_request_date
    FROM public.privacy_requests pr
    LEFT JOIN public.processing_restrictions pres ON pres.user_id = pr.user_id
    LEFT JOIN public.data_exports de ON de.user_id = pr.user_id
    WHERE pr.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired data exports
CREATE OR REPLACE FUNCTION public.cleanup_expired_data_exports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.data_exports 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired processing restrictions
CREATE OR REPLACE FUNCTION public.cleanup_expired_processing_restrictions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.processing_restrictions 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE expires_at < NOW()
    AND is_active = true;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Update users table for users with no active restrictions
    UPDATE public.users 
    SET 
        processing_restricted = false,
        processing_restriction_reason = NULL,
        processing_restricted_at = NULL
    WHERE id IN (
        SELECT DISTINCT user_id 
        FROM public.processing_restrictions 
        WHERE expires_at < NOW()
        AND is_active = false
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.processing_restrictions 
        WHERE user_id = users.id 
        AND is_active = true
    );
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_privacy_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_privacy_request_status TO service_role;
GRANT EXECUTE ON FUNCTION public.create_data_export TO service_role;
GRANT EXECUTE ON FUNCTION public.track_data_export_download TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_processing_restriction TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_processing_restriction TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_privacy_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_data_exports TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_processing_restrictions TO service_role;

-- Create view for privacy dashboard
CREATE OR REPLACE VIEW public.privacy_dashboard AS
SELECT 
    pr.id,
    pr.user_id,
    u.full_name,
    u.email,
    pr.action,
    pr.status,
    pr.urgency,
    pr.requested_at,
    pr.processed_at,
    pr.completed_at,
    pr.grace_period_ends,
    pr.admin_notes,
    CASE 
        WHEN pr.action = 'export_my_data' THEN de.id
        ELSE NULL
    END as export_id,
    CASE 
        WHEN pr.action = 'export_my_data' THEN de.expires_at
        ELSE NULL
    END as export_expires_at
FROM public.privacy_requests pr
JOIN public.users u ON u.id = pr.user_id
LEFT JOIN public.data_exports de ON de.request_id = pr.id
ORDER BY pr.requested_at DESC;

-- Grant access to privacy dashboard
GRANT SELECT ON public.privacy_dashboard TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_privacy_requests_updated_at
    BEFORE UPDATE ON public.privacy_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processing_restrictions_updated_at
    BEFORE UPDATE ON public.processing_restrictions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();





