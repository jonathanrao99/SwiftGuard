-- Optimize Query Performance - Priority 2
-- This migration adds critical indexes and optimizations for better performance

-- =============================================
-- 1. COMPOSITE INDEXES FOR COMMON QUERIES
-- =============================================

-- Jobs table composite indexes
CREATE INDEX IF NOT EXISTS idx_jobs_client_status_created 
    ON jobs(client_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_status_created_location 
    ON jobs(status, created_at DESC, location);

CREATE INDEX IF NOT EXISTS idx_jobs_payment_status_created 
    ON jobs(payment_status, created_at DESC) 
    WHERE payment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_priority_status_created 
    ON jobs(priority_level, status, created_at DESC) 
    WHERE priority_level IS NOT NULL;

-- Job guards table composite indexes
CREATE INDEX IF NOT EXISTS idx_job_guards_guard_status_created 
    ON job_guards(guard_id, status, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_guards_job_status 
    ON job_guards(job_id, status);

-- Payments table composite indexes
CREATE INDEX IF NOT EXISTS idx_payments_client_status_created 
    ON payments(client_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_guard_status_created 
    ON payments(guard_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_job_status 
    ON payments(job_id, status);

-- Guard ratings table composite indexes
CREATE INDEX IF NOT EXISTS idx_guard_ratings_guard_created 
    ON guard_ratings(guard_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guard_ratings_job_rating 
    ON guard_ratings(job_id, rating);

-- Notifications table composite indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
    ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type_priority_created 
    ON notifications(type, priority, created_at DESC);

-- =============================================
-- 2. PARTIAL INDEXES FOR FILTERED QUERIES
-- =============================================

-- Active jobs only
CREATE INDEX IF NOT EXISTS idx_jobs_active_created 
    ON jobs(created_at DESC) 
    WHERE status = 'active';

-- Pending jobs only
CREATE INDEX IF NOT EXISTS idx_jobs_pending_created 
    ON jobs(created_at DESC) 
    WHERE status = 'pending';

-- Completed jobs only
CREATE INDEX IF NOT EXISTS idx_jobs_completed_created 
    ON jobs(created_at DESC) 
    WHERE status = 'completed';

-- Unread notifications only
CREATE INDEX IF NOT EXISTS idx_notifications_unread_user_created 
    ON notifications(user_id, created_at DESC) 
    WHERE read = false;

-- High priority notifications only
CREATE INDEX IF NOT EXISTS idx_notifications_high_priority_created 
    ON notifications(created_at DESC) 
    WHERE priority IN ('high', 'critical');

-- Active users only
CREATE INDEX IF NOT EXISTS idx_users_active_role 
    ON users(role, created_at DESC) 
    WHERE status = 'active';

-- Pending payments only
CREATE INDEX IF NOT EXISTS idx_payments_pending_created 
    ON payments(created_at DESC) 
    WHERE status = 'pending';

-- =============================================
-- 3. GIN INDEXES FOR JSONB COLUMNS
-- =============================================

-- Jobs table JSONB indexes
CREATE INDEX IF NOT EXISTS idx_jobs_requirements_gin 
    ON jobs USING GIN(requirements);

CREATE INDEX IF NOT EXISTS idx_jobs_client_contact_info_gin 
    ON jobs USING GIN(client_contact_info);

CREATE INDEX IF NOT EXISTS idx_jobs_geofence_gin 
    ON jobs USING GIN(geofence);

CREATE INDEX IF NOT EXISTS idx_jobs_checkpoint_locations_gin 
    ON jobs USING GIN(checkpoint_locations);

-- Analytics events JSONB indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties_gin 
    ON analytics_events USING GIN(properties);

-- Security logs JSONB indexes
CREATE INDEX IF NOT EXISTS idx_security_logs_details_gin 
    ON security_logs USING GIN(details);

-- =============================================
-- 4. TEXT SEARCH INDEXES
-- =============================================

-- Jobs table text search
CREATE INDEX IF NOT EXISTS idx_jobs_title_text 
    ON jobs USING GIN(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_jobs_description_text 
    ON jobs USING GIN(to_tsvector('english', description));

CREATE INDEX IF NOT EXISTS idx_jobs_location_text 
    ON jobs USING GIN(to_tsvector('english', location));

-- Users table text search
CREATE INDEX IF NOT EXISTS idx_users_name_text 
    ON users USING GIN(to_tsvector('english', first_name || ' ' || last_name));

-- =============================================
-- 5. COVERING INDEXES FOR COMMON SELECTS
-- =============================================

-- Jobs list view covering index
CREATE INDEX IF NOT EXISTS idx_jobs_list_covering 
    ON jobs(client_id, status, created_at DESC) 
    INCLUDE (id, title, location, hourly_pay, total_amount, num_guards, event_dates);

-- Job guards list view covering index
CREATE INDEX IF NOT EXISTS idx_job_guards_list_covering 
    ON job_guards(guard_id, status, assigned_at DESC) 
    INCLUDE (id, job_id, status);

-- Notifications list view covering index
CREATE INDEX IF NOT EXISTS idx_notifications_list_covering 
    ON notifications(user_id, read, created_at DESC) 
    INCLUDE (id, type, title, body, priority);

-- =============================================
-- 6. FUNCTION-BASED INDEXES
-- =============================================

-- Date-based indexes for common date operations
CREATE INDEX IF NOT EXISTS idx_jobs_event_dates_date 
    ON jobs USING GIN((event_dates::date[]));

-- Extract year from created_at for yearly reports
CREATE INDEX IF NOT EXISTS idx_jobs_created_year 
    ON jobs(EXTRACT(YEAR FROM created_at), status);

-- Extract month from created_at for monthly reports
CREATE INDEX IF NOT EXISTS idx_jobs_created_month 
    ON jobs(EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at), status);

-- =============================================
-- 7. STATISTICS UPDATES
-- =============================================

-- Update table statistics for better query planning
ANALYZE jobs;
ANALYZE job_guards;
ANALYZE payments;
ANALYZE guard_ratings;
ANALYZE notifications;
ANALYZE users;
ANALYZE analytics_events;
ANALYZE security_logs;

-- =============================================
-- 8. QUERY OPTIMIZATION FUNCTIONS
-- =============================================

-- Function to get jobs with optimized query
CREATE OR REPLACE FUNCTION get_jobs_for_user(user_id_param UUID, limit_param INTEGER DEFAULT 50, offset_param INTEGER DEFAULT 0)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    location TEXT,
    hourly_pay NUMERIC,
    total_amount NUMERIC,
    num_guards INTEGER,
    status TEXT,
    payment_status TEXT,
    created_at TIMESTAMPTZ,
    event_dates DATE[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.title,
        j.description,
        j.location,
        j.hourly_pay,
        j.total_amount,
        j.num_guards,
        j.status,
        j.payment_status,
        j.created_at,
        j.event_dates
    FROM jobs j
    WHERE j.client_id = user_id_param
    ORDER BY j.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get guard jobs with optimized query
CREATE OR REPLACE FUNCTION get_guard_jobs(guard_id_param UUID, limit_param INTEGER DEFAULT 50, offset_param INTEGER DEFAULT 0)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    location TEXT,
    hourly_pay NUMERIC,
    total_amount NUMERIC,
    num_guards INTEGER,
    status TEXT,
    payment_status TEXT,
    created_at TIMESTAMPTZ,
    event_dates DATE[],
    assignment_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.title,
        j.description,
        j.location,
        j.hourly_pay,
        j.total_amount,
        j.num_guards,
        j.status,
        j.payment_status,
        j.created_at,
        j.event_dates,
        jg.status as assignment_status
    FROM jobs j
    JOIN job_guards jg ON j.id = jg.job_id
    WHERE jg.guard_id = guard_id_param
    ORDER BY j.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notifications with optimized query
CREATE OR REPLACE FUNCTION get_user_notifications(user_id_param UUID, limit_param INTEGER DEFAULT 50, offset_param INTEGER DEFAULT 0)
RETURNS TABLE(
    id UUID,
    type TEXT,
    title TEXT,
    body TEXT,
    priority TEXT,
    read BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.body,
        n.priority,
        n.read,
        n.created_at
    FROM notifications n
    WHERE n.user_id = user_id_param
    ORDER BY n.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 9. MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- =============================================

-- Materialized view for job statistics
CREATE MATERIALIZED VIEW job_statistics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    status,
    COUNT(*) as job_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_job_value,
    AVG(duration) as avg_duration
FROM jobs
GROUP BY DATE_TRUNC('month', created_at), status;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_job_statistics_month_status 
    ON job_statistics(month, status);

-- Materialized view for guard performance
CREATE MATERIALIZED VIEW guard_performance AS
SELECT 
    gr.guard_id,
    u.first_name,
    u.last_name,
    COUNT(gr.id) as total_ratings,
    AVG(gr.rating) as avg_rating,
    COUNT(CASE WHEN gr.rating >= 4 THEN 1 END) as high_ratings,
    COUNT(CASE WHEN gr.rating <= 2 THEN 1 END) as low_ratings
FROM guard_ratings gr
JOIN users u ON gr.guard_id = u.id
GROUP BY gr.guard_id, u.first_name, u.last_name;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_guard_performance_guard_id 
    ON guard_performance(guard_id);

-- =============================================
-- 10. REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- =============================================

-- Function to refresh job statistics
CREATE OR REPLACE FUNCTION refresh_job_statistics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW job_statistics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh guard performance
CREATE OR REPLACE FUNCTION refresh_guard_performance()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW guard_performance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 11. AUTOMATIC REFRESH TRIGGERS
-- =============================================

-- Function to refresh materialized views when data changes
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh job statistics when jobs change
    IF TG_TABLE_NAME = 'jobs' THEN
        PERFORM refresh_job_statistics();
    END IF;
    
    -- Refresh guard performance when ratings change
    IF TG_TABLE_NAME = 'guard_ratings' THEN
        PERFORM refresh_guard_performance();
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic refresh
CREATE TRIGGER refresh_job_statistics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON jobs
    FOR EACH STATEMENT EXECUTE FUNCTION refresh_materialized_views();

CREATE TRIGGER refresh_guard_performance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON guard_ratings
    FOR EACH STATEMENT EXECUTE FUNCTION refresh_materialized_views();

-- =============================================
-- 12. QUERY PLAN OPTIMIZATION
-- =============================================

-- Set work_mem for better sorting and hashing
-- This should be set at the database level, but we'll document it
COMMENT ON DATABASE postgres IS 'Consider setting work_mem = 256MB for better query performance';

-- =============================================
-- 13. COMMENTS ON OPTIMIZATIONS
-- =============================================

COMMENT ON INDEX idx_jobs_client_status_created IS 'Optimizes queries for user job lists';
COMMENT ON INDEX idx_jobs_status_created_location IS 'Optimizes queries for job search by location';
COMMENT ON INDEX idx_jobs_active_created IS 'Optimizes queries for active jobs only';
COMMENT ON INDEX idx_notifications_unread_user_created IS 'Optimizes queries for unread notifications';
COMMENT ON INDEX idx_jobs_title_text IS 'Enables full-text search on job titles';
COMMENT ON INDEX idx_jobs_list_covering IS 'Covering index for job list queries';

COMMENT ON FUNCTION get_jobs_for_user(UUID, INTEGER, INTEGER) IS 'Optimized function to get user jobs';
COMMENT ON FUNCTION get_guard_jobs(UUID, INTEGER, INTEGER) IS 'Optimized function to get guard jobs';
COMMENT ON FUNCTION get_user_notifications(UUID, INTEGER, INTEGER) IS 'Optimized function to get user notifications';

COMMENT ON MATERIALIZED VIEW job_statistics IS 'Pre-computed job statistics for reporting';
COMMENT ON MATERIALIZED VIEW guard_performance IS 'Pre-computed guard performance metrics';
