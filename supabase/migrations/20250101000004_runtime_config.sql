-- SwiftGuard Runtime Configuration System
-- Provides remote kill switch and feature flags

-- Create runtime configuration table
CREATE TABLE IF NOT EXISTS public.runtime_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'preview', 'staging', 'production')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id)
);

-- Create app version requirements table
CREATE TABLE IF NOT EXISTS public.app_version_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    min_supported_version TEXT NOT NULL,
    min_recommended_version TEXT NOT NULL,
    latest_version TEXT NOT NULL,
    force_update BOOLEAN DEFAULT false,
    update_message TEXT,
    update_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key TEXT NOT NULL UNIQUE,
    flag_name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'guards', 'clients', 'admins')),
    environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'preview', 'staging', 'production')),
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id)
);

-- Create feature flag assignments table
CREATE TABLE IF NOT EXISTS public.feature_flag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    flag_key TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, flag_key)
);

-- Insert default runtime configuration
INSERT INTO public.runtime_config (key, value, description, environment) VALUES
    ('app_kill_switch', '{"enabled": false, "message": "App is temporarily unavailable. Please try again later.", "retry_after": 3600}', 'Global app kill switch', 'production'),
    ('maintenance_mode', '{"enabled": false, "message": "App is under maintenance. Please try again later.", "estimated_duration": "2 hours"}', 'Maintenance mode toggle', 'production'),
    ('emergency_mode', '{"enabled": false, "message": "Emergency services are active. Non-essential features may be limited.", "priority": "high"}', 'Emergency mode for crisis situations', 'production'),
    ('payment_processing', '{"enabled": true, "message": "Payment processing is available"}', 'Payment system availability', 'production'),
    ('guard_dispatch', '{"enabled": true, "message": "Guard dispatch is available"}', 'Guard dispatch system availability', 'production'),
    ('location_tracking', '{"enabled": true, "message": "Location tracking is available"}', 'Location tracking availability', 'production'),
    ('notifications', '{"enabled": true, "message": "Notifications are available"}', 'Notification system availability', 'production'),
    ('analytics', '{"enabled": true, "message": "Analytics collection is enabled"}', 'Analytics collection toggle', 'production'),
    ('debug_mode', '{"enabled": false, "message": "Debug mode is disabled"}', 'Debug mode toggle', 'production'),
    ('rate_limiting', '{"enabled": true, "message": "Rate limiting is active"}', 'Rate limiting toggle', 'production')
ON CONFLICT (key) DO NOTHING;

-- Insert default app version requirements
INSERT INTO public.app_version_requirements (platform, min_supported_version, min_recommended_version, latest_version, force_update, update_message, update_url) VALUES
    ('ios', '1.0.0', '1.0.0', '1.0.0', false, 'A new version is available with important updates.', 'https://apps.apple.com/app/swiftguard/id123456789'),
    ('android', '1.0.0', '1.0.0', '1.0.0', false, 'A new version is available with important updates.', 'https://play.google.com/store/apps/details?id=com.swiftguard.app'),
    ('web', '1.0.0', '1.0.0', '1.0.0', false, 'A new version is available with important updates.', 'https://swiftguard.com')
ON CONFLICT DO NOTHING;

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_key, flag_name, description, is_enabled, rollout_percentage, target_audience, environment) VALUES
    ('dynamic_pricing_v1', 'Dynamic Pricing', 'Enable dynamic pricing based on demand and availability', false, 0, 'all', 'production'),
    ('premium_guard_tiers_v1', 'Premium Guard Tiers', 'Enable premium guard tier system', false, 0, 'all', 'production'),
    ('corporate_packages_v1', 'Corporate Packages', 'Enable corporate package offerings', false, 0, 'all', 'production'),
    ('advanced_analytics_v1', 'Advanced Analytics', 'Enable advanced analytics dashboard', false, 0, 'admins', 'production'),
    ('beta_features_v1', 'Beta Features', 'Enable beta features for testing', false, 0, 'all', 'production'),
    ('emergency_contacts_v1', 'Emergency Contacts', 'Enable emergency contacts feature', true, 100, 'all', 'production'),
    ('location_sharing_v1', 'Location Sharing', 'Enable location sharing with emergency contacts', true, 100, 'all', 'production'),
    ('push_notifications_v1', 'Push Notifications', 'Enable push notifications', true, 100, 'all', 'production')
ON CONFLICT (flag_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_runtime_config_key ON public.runtime_config (key);
CREATE INDEX IF NOT EXISTS idx_runtime_config_environment ON public.runtime_config (environment);
CREATE INDEX IF NOT EXISTS idx_runtime_config_active ON public.runtime_config (is_active);

CREATE INDEX IF NOT EXISTS idx_app_version_requirements_platform ON public.app_version_requirements (platform);
CREATE INDEX IF NOT EXISTS idx_app_version_requirements_active ON public.app_version_requirements (is_active);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags (flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON public.feature_flags (environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_active ON public.feature_flags (is_active);

CREATE INDEX IF NOT EXISTS idx_feature_flag_assignments_user_id ON public.feature_flag_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_assignments_flag_key ON public.feature_flag_assignments (flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flag_assignments_expires_at ON public.feature_flag_assignments (expires_at);

-- Enable RLS on all tables
ALTER TABLE public.runtime_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_version_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for runtime_config (admin only)
CREATE POLICY "Admin can manage runtime config" ON public.runtime_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for app_version_requirements (admin only)
CREATE POLICY "Admin can manage app version requirements" ON public.app_version_requirements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for feature_flags (admin only)
CREATE POLICY "Admin can manage feature flags" ON public.feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for feature_flag_assignments (users can view own assignments)
CREATE POLICY "Users can view own feature flag assignments" ON public.feature_flag_assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage feature flag assignments" ON public.feature_flag_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to get runtime configuration
CREATE OR REPLACE FUNCTION public.get_runtime_config(p_environment TEXT DEFAULT 'production')
RETURNS TABLE(
    key TEXT,
    value JSONB,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.key,
        rc.value,
        rc.description
    FROM public.runtime_config rc
    WHERE rc.environment = p_environment
    AND rc.is_active = true
    ORDER BY rc.key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get app version requirements
CREATE OR REPLACE FUNCTION public.get_app_version_requirements(p_platform TEXT)
RETURNS TABLE(
    platform TEXT,
    min_supported_version TEXT,
    min_recommended_version TEXT,
    latest_version TEXT,
    force_update BOOLEAN,
    update_message TEXT,
    update_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        avr.platform,
        avr.min_supported_version,
        avr.min_recommended_version,
        avr.latest_version,
        avr.force_update,
        avr.update_message,
        avr.update_url
    FROM public.app_version_requirements avr
    WHERE avr.platform = p_platform
    AND avr.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feature flags for user
CREATE OR REPLACE FUNCTION public.get_user_feature_flags(p_user_id UUID, p_environment TEXT DEFAULT 'production')
RETURNS TABLE(
    flag_key TEXT,
    flag_name TEXT,
    is_enabled BOOLEAN,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ff.flag_key,
        ff.flag_name,
        COALESCE(ffa.is_enabled, ff.is_enabled) as is_enabled,
        ff.metadata
    FROM public.feature_flags ff
    LEFT JOIN public.feature_flag_assignments ffa ON ffa.flag_key = ff.flag_key 
        AND ffa.user_id = p_user_id 
        AND (ffa.expires_at IS NULL OR ffa.expires_at > NOW())
    WHERE ff.environment = p_environment
    AND ff.is_active = true
    AND (
        ff.target_audience = 'all' OR
        (ff.target_audience = 'guards' AND EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND role = 'guard')) OR
        (ff.target_audience = 'clients' AND EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND role = 'client')) OR
        (ff.target_audience = 'admins' AND EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND role = 'admin'))
    )
    ORDER BY ff.flag_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign feature flag to user
CREATE OR REPLACE FUNCTION public.assign_feature_flag(
    p_user_id UUID,
    p_flag_key TEXT,
    p_is_enabled BOOLEAN,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.feature_flag_assignments (user_id, flag_key, is_enabled, expires_at)
    VALUES (p_user_id, p_flag_key, p_is_enabled, p_expires_at)
    ON CONFLICT (user_id, flag_key) 
    DO UPDATE SET 
        is_enabled = p_is_enabled,
        expires_at = p_expires_at;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update runtime configuration
CREATE OR REPLACE FUNCTION public.update_runtime_config(
    p_key TEXT,
    p_value JSONB,
    p_environment TEXT DEFAULT 'production',
    p_updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.runtime_config 
    SET 
        value = p_value,
        updated_at = NOW(),
        updated_by = p_updated_by
    WHERE key = p_key 
    AND environment = p_environment;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if app version is supported
CREATE OR REPLACE FUNCTION public.check_app_version_support(
    p_platform TEXT,
    p_current_version TEXT
)
RETURNS TABLE(
    is_supported BOOLEAN,
    is_recommended BOOLEAN,
    force_update BOOLEAN,
    update_message TEXT,
    update_url TEXT
) AS $$
DECLARE
    min_supported TEXT;
    min_recommended TEXT;
    force_update_flag BOOLEAN;
    update_msg TEXT;
    update_url_val TEXT;
BEGIN
    SELECT 
        avr.min_supported_version,
        avr.min_recommended_version,
        avr.force_update,
        avr.update_message,
        avr.update_url
    INTO min_supported, min_recommended, force_update_flag, update_msg, update_url_val
    FROM public.app_version_requirements avr
    WHERE avr.platform = p_platform
    AND avr.is_active = true
    LIMIT 1;
    
    IF min_supported IS NULL THEN
        RETURN QUERY SELECT true, true, false, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 
        (p_current_version >= min_supported) as is_supported,
        (p_current_version >= min_recommended) as is_recommended,
        force_update_flag,
        update_msg,
        update_url_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get kill switch status
CREATE OR REPLACE FUNCTION public.get_kill_switch_status()
RETURNS TABLE(
    is_enabled BOOLEAN,
    message TEXT,
    retry_after INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (rc.value->>'enabled')::BOOLEAN as is_enabled,
        rc.value->>'message' as message,
        (rc.value->>'retry_after')::INTEGER as retry_after
    FROM public.runtime_config rc
    WHERE rc.key = 'app_kill_switch'
    AND rc.environment = 'production'
    AND rc.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_runtime_config TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_app_version_requirements TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feature_flags TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_feature_flag TO service_role;
GRANT EXECUTE ON FUNCTION public.update_runtime_config TO service_role;
GRANT EXECUTE ON FUNCTION public.check_app_version_support TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kill_switch_status TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_runtime_config_updated_at
    BEFORE UPDATE ON public.runtime_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_version_requirements_updated_at
    BEFORE UPDATE ON public.app_version_requirements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for runtime configuration dashboard
CREATE OR REPLACE VIEW public.runtime_config_dashboard AS
SELECT 
    rc.key,
    rc.value,
    rc.description,
    rc.environment,
    rc.is_active,
    rc.updated_at,
    u.full_name as updated_by_name
FROM public.runtime_config rc
LEFT JOIN public.users u ON u.id = rc.updated_by
ORDER BY rc.environment, rc.key;

-- Grant access to dashboard view
GRANT SELECT ON public.runtime_config_dashboard TO authenticated;




