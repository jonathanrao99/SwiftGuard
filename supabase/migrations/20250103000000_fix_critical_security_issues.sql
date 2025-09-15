-- Fix Critical Security Issues - Priority 2
-- This migration addresses missing RLS policies and security vulnerabilities

-- =============================================
-- 1. JOBS TABLE SECURITY (CRITICAL MISSING)
-- =============================================

-- Enable RLS on jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view jobs they're involved in" ON jobs;
DROP POLICY IF EXISTS "Clients can create jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update jobs they own" ON jobs;
DROP POLICY IF EXISTS "Users can delete jobs they own" ON jobs;
DROP POLICY IF EXISTS "Service role can access all jobs" ON jobs;

-- Jobs RLS policies
CREATE POLICY "Users can view jobs they're involved in" ON jobs
    FOR SELECT USING (
        auth.uid() = client_id OR 
        auth.uid() IN (
            SELECT guard_id FROM job_guards WHERE job_id = jobs.id
        ) OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Clients can create jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update jobs they own" ON jobs
    FOR UPDATE USING (
        auth.uid() = client_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete jobs they own" ON jobs
    FOR DELETE USING (
        auth.uid() = client_id AND 
        status IN ('pending', 'cancelled')
    );

CREATE POLICY "Service role can access all jobs" ON jobs
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 2. JOB_GUARDS TABLE SECURITY
-- =============================================

-- Enable RLS on job_guards table
ALTER TABLE job_guards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view job guards for their jobs" ON job_guards;
DROP POLICY IF EXISTS "Users can create job guard assignments" ON job_guards;
DROP POLICY IF EXISTS "Users can update job guard assignments" ON job_guards;
DROP POLICY IF EXISTS "Service role can access all job guards" ON job_guards;

-- Job guards RLS policies
CREATE POLICY "Users can view job guards for their jobs" ON job_guards
    FOR SELECT USING (
        auth.uid() IN (
            SELECT client_id FROM jobs WHERE id = job_guards.job_id
            UNION
            SELECT guard_id FROM job_guards WHERE guard_id = auth.uid()
        ) OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can create job guard assignments" ON job_guards
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT client_id FROM jobs WHERE id = job_guards.job_id
        ) OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can update job guard assignments" ON job_guards
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT client_id FROM jobs WHERE id = job_guards.job_id
            UNION
            SELECT guard_id FROM job_guards WHERE guard_id = auth.uid()
        ) OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Service role can access all job guards" ON job_guards
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 3. GUARD_RATINGS TABLE SECURITY
-- =============================================

-- Enable RLS on guard_ratings table
ALTER TABLE guard_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view ratings for their jobs" ON guard_ratings;
DROP POLICY IF EXISTS "Users can create ratings for their jobs" ON guard_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON guard_ratings;
DROP POLICY IF EXISTS "Service role can access all ratings" ON guard_ratings;

-- Guard ratings RLS policies
CREATE POLICY "Users can view ratings for their jobs" ON guard_ratings
    FOR SELECT USING (
        auth.uid() IN (
            SELECT client_id FROM jobs WHERE id = guard_ratings.job_id
            UNION
            SELECT guard_id FROM jobs WHERE id = guard_ratings.job_id
        ) OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can create ratings for their jobs" ON guard_ratings
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT client_id FROM jobs WHERE id = guard_ratings.job_id
        ) AND
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE id = guard_ratings.job_id 
            AND status = 'completed'
        )
    );

CREATE POLICY "Users can update their own ratings" ON guard_ratings
    FOR UPDATE USING (
        auth.uid() = client_id AND
        created_at > NOW() - INTERVAL '24 hours' -- Only allow updates within 24 hours
    );

CREATE POLICY "Service role can access all ratings" ON guard_ratings
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 4. EMERGENCY_CONTACTS TABLE SECURITY
-- =============================================

-- Enable RLS on emergency_contacts table
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own emergency contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Users can manage their own emergency contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Service role can access all emergency contacts" ON emergency_contacts;

-- Emergency contacts RLS policies
CREATE POLICY "Users can view their own emergency contacts" ON emergency_contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own emergency contacts" ON emergency_contacts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all emergency contacts" ON emergency_contacts
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 5. ANALYTICS_EVENTS TABLE SECURITY
-- =============================================

-- Enable RLS on analytics_events table
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Service role can access all analytics events" ON analytics_events;

-- Analytics events RLS policies
CREATE POLICY "Users can insert their own analytics events" ON analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics events" ON analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Service role can access all analytics events" ON analytics_events
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 6. SECURITY_LOGS TABLE SECURITY
-- =============================================

-- Enable RLS on security_logs table
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own security logs" ON security_logs;
DROP POLICY IF EXISTS "Admins can view all security logs" ON security_logs;
DROP POLICY IF EXISTS "Service role can access all security logs" ON security_logs;

-- Security logs RLS policies
CREATE POLICY "Users can view their own security logs" ON security_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security logs" ON security_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Service role can access all security logs" ON security_logs
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 7. LOCATION_HISTORY TABLE SECURITY
-- =============================================

-- Enable RLS on location_history table
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own location history" ON location_history;
DROP POLICY IF EXISTS "Users can insert their own location history" ON location_history;
DROP POLICY IF EXISTS "Admins can view all location history" ON location_history;
DROP POLICY IF EXISTS "Service role can access all location history" ON location_history;

-- Location history RLS policies
CREATE POLICY "Users can view their own location history" ON location_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location history" ON location_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all location history" ON location_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Service role can access all location history" ON location_history
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 8. SESSION_DATA TABLE SECURITY
-- =============================================

-- Enable RLS on session_data table
ALTER TABLE session_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own session data" ON session_data;
DROP POLICY IF EXISTS "Users can manage their own session data" ON session_data;
DROP POLICY IF EXISTS "Service role can access all session data" ON session_data;

-- Session data RLS policies
CREATE POLICY "Users can view their own session data" ON session_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own session data" ON session_data
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all session data" ON session_data
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 9. NOTIFICATION_LOGS TABLE SECURITY
-- =============================================

-- Enable RLS on notification_logs table
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notification logs" ON notification_logs;
DROP POLICY IF EXISTS "Users can insert their own notification logs" ON notification_logs;
DROP POLICY IF EXISTS "Admins can view all notification logs" ON notification_logs;
DROP POLICY IF EXISTS "Service role can access all notification logs" ON notification_logs;

-- Notification logs RLS policies
CREATE POLICY "Users can view their own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification logs" ON notification_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification logs" ON notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Service role can access all notification logs" ON notification_logs
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 10. CRITICAL INDEXES FOR PERFORMANCE
-- =============================================

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_event_dates ON jobs USING GIN(event_dates);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON jobs(payment_status);

-- Job guards table indexes
CREATE INDEX IF NOT EXISTS idx_job_guards_job_id ON job_guards(job_id);
CREATE INDEX IF NOT EXISTS idx_job_guards_guard_id ON job_guards(guard_id);
CREATE INDEX IF NOT EXISTS idx_job_guards_status ON job_guards(status);

-- Guard ratings table indexes
CREATE INDEX IF NOT EXISTS idx_guard_ratings_job_id ON guard_ratings(job_id);
CREATE INDEX IF NOT EXISTS idx_guard_ratings_guard_id ON guard_ratings(guard_id);
CREATE INDEX IF NOT EXISTS idx_guard_ratings_client_id ON guard_ratings(client_id);
CREATE INDEX IF NOT EXISTS idx_guard_ratings_created_at ON guard_ratings(created_at);

-- Emergency contacts table indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- Analytics events table indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Security logs table indexes
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

-- Location history table indexes
CREATE INDEX IF NOT EXISTS idx_location_history_user_id ON location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_location_history_created_at ON location_history(created_at);
CREATE INDEX IF NOT EXISTS idx_location_history_job_id ON location_history(job_id);

-- Session data table indexes
CREATE INDEX IF NOT EXISTS idx_session_data_user_id ON session_data(user_id);
CREATE INDEX IF NOT EXISTS idx_session_data_expires_at ON session_data(expires_at);

-- Notification logs table indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

-- =============================================
-- 11. SECURITY FUNCTIONS
-- =============================================

-- Function to check if user can access job data
CREATE OR REPLACE FUNCTION can_access_job_data(job_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow if user is the client
    IF EXISTS (SELECT 1 FROM jobs WHERE id = job_id_param AND client_id = auth.uid()) THEN
        RETURN TRUE;
    END IF;
    
    -- Allow if user is assigned as guard
    IF EXISTS (
        SELECT 1 FROM job_guards jg 
        JOIN jobs j ON j.id = jg.job_id 
        WHERE j.id = job_id_param AND jg.guard_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Allow service role
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    event_type_param TEXT,
    user_id_param UUID DEFAULT auth.uid(),
    details_param JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_logs (user_id, event_type, details, ip_address, user_agent)
    VALUES (
        user_id_param,
        event_type_param,
        details_param,
        current_setting('request.headers.x-forwarded-for', true),
        current_setting('request.headers.user-agent', true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 12. AUDIT TRIGGERS
-- =============================================

-- Create audit function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the change
    INSERT INTO security_logs (user_id, event_type, details)
    VALUES (
        auth.uid(),
        'data_change',
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'old_data', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
            'new_data', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables
CREATE TRIGGER audit_jobs_trigger
    AFTER INSERT OR UPDATE OR DELETE ON jobs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- 13. GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =============================================
-- 14. SECURITY COMMENTS
-- =============================================

COMMENT ON TABLE jobs IS 'Jobs table with RLS policies - users can only access jobs they are involved in';
COMMENT ON TABLE job_guards IS 'Job guards table with RLS policies - users can only access assignments for their jobs';
COMMENT ON TABLE guard_ratings IS 'Guard ratings table with RLS policies - users can only access ratings for their jobs';
COMMENT ON TABLE emergency_contacts IS 'Emergency contacts table with RLS policies - users can only access their own contacts';
COMMENT ON TABLE analytics_events IS 'Analytics events table with RLS policies - users can only insert their own events';
COMMENT ON TABLE security_logs IS 'Security logs table with RLS policies - users can only access their own logs';
COMMENT ON TABLE location_history IS 'Location history table with RLS policies - users can only access their own location data';
COMMENT ON TABLE session_data IS 'Session data table with RLS policies - users can only access their own session data';
COMMENT ON TABLE notification_logs IS 'Notification logs table with RLS policies - users can only access their own logs';

COMMENT ON FUNCTION can_access_job_data(UUID) IS 'Security function to check if user can access job data';
COMMENT ON FUNCTION log_security_event(TEXT, UUID, JSONB) IS 'Security function to log security events';
COMMENT ON FUNCTION audit_trigger_function() IS 'Audit trigger function to log all data changes';
