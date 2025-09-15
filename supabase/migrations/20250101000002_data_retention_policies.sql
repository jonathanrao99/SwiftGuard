-- SwiftGuard Data Retention Policies and Purge Jobs
-- Implements automated data cleanup and retention management

-- Create data retention configuration table
CREATE TABLE IF NOT EXISTS public.data_retention_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    retention_days INTEGER NOT NULL,
    soft_delete_days INTEGER DEFAULT 30,
    enabled BOOLEAN DEFAULT true,
    last_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(table_name)
);

-- Create deletion queue table
CREATE TABLE IF NOT EXISTS public.deletion_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    user_id UUID,
    deletion_type TEXT NOT NULL CHECK (deletion_type IN ('soft', 'hard', 'anonymize')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data retention audit log
CREATE TABLE IF NOT EXISTS public.data_retention_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation TEXT NOT NULL,
    table_name TEXT NOT NULL,
    records_affected INTEGER NOT NULL,
    execution_time_ms INTEGER,
    status TEXT NOT NULL,
    error_message TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default retention configurations
INSERT INTO public.data_retention_config (table_name, retention_days, soft_delete_days, enabled) VALUES
    ('users', 2555, 30, true), -- 7 years
    ('jobs', 2555, 30, true), -- 7 years
    ('payments', 2555, 30, true), -- 7 years
    ('guard_ratings', 2555, 30, true), -- 7 years
    ('emergency_contacts', 2555, 30, true), -- 7 years
    ('analytics_events', 730, 0, true), -- 2 years
    ('security_logs', 365, 0, true), -- 1 year
    ('location_history', 30, 0, true), -- 30 days
    ('session_data', 730, 0, true), -- 2 years
    ('notification_logs', 730, 0, true) -- 2 years
ON CONFLICT (table_name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deletion_queue_scheduled_at ON public.deletion_queue (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_deletion_queue_status ON public.deletion_queue (status);
CREATE INDEX IF NOT EXISTS idx_deletion_queue_table_record ON public.deletion_queue (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_data_retention_audit_executed_at ON public.data_retention_audit (executed_at);

-- Enable RLS on new tables
ALTER TABLE public.data_retention_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for data retention config (admin only)
CREATE POLICY "Admin can manage retention config" ON public.data_retention_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for deletion queue (admin only)
CREATE POLICY "Admin can manage deletion queue" ON public.deletion_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for audit log (admin only)
CREATE POLICY "Admin can read audit log" ON public.data_retention_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to add records to deletion queue
CREATE OR REPLACE FUNCTION public.add_to_deletion_queue(
    p_table_name TEXT,
    p_record_id TEXT,
    p_user_id UUID DEFAULT NULL,
    p_deletion_type TEXT DEFAULT 'soft',
    p_delay_days INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    queue_id UUID;
BEGIN
    INSERT INTO public.deletion_queue (
        table_name,
        record_id,
        user_id,
        deletion_type,
        scheduled_at
    ) VALUES (
        p_table_name,
        p_record_id,
        p_user_id,
        p_deletion_type,
        NOW() + INTERVAL '1 day' * p_delay_days
    ) RETURNING id INTO queue_id;
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process soft deletions
CREATE OR REPLACE FUNCTION public.process_soft_deletions()
RETURNS TABLE(
    table_name TEXT,
    records_processed INTEGER,
    execution_time_ms INTEGER
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time INTEGER;
    records_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Process users table
    UPDATE public.users 
    SET is_active = false, updated_at = NOW()
    WHERE id IN (
        SELECT record_id::UUID 
        FROM public.deletion_queue 
        WHERE table_name = 'users' 
        AND deletion_type = 'soft' 
        AND status = 'pending'
        AND scheduled_at <= NOW()
    );
    
    GET DIAGNOSTICS records_count = ROW_COUNT;
    
    -- Update deletion queue status
    UPDATE public.deletion_queue 
    SET status = 'completed', processed_at = NOW()
    WHERE table_name = 'users' 
    AND deletion_type = 'soft' 
    AND status = 'pending'
    AND scheduled_at <= NOW();
    
    end_time := clock_timestamp();
    execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Log audit
    INSERT INTO public.data_retention_audit (
        operation, table_name, records_affected, execution_time_ms, status
    ) VALUES (
        'soft_delete', 'users', records_count, execution_time, 'completed'
    );
    
    RETURN QUERY SELECT 'users'::TEXT, records_count, execution_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process hard deletions
CREATE OR REPLACE FUNCTION public.process_hard_deletions()
RETURNS TABLE(
    table_name TEXT,
    records_processed INTEGER,
    execution_time_ms INTEGER
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time INTEGER;
    records_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Process analytics_events table
    DELETE FROM public.analytics_events 
    WHERE id IN (
        SELECT record_id::UUID 
        FROM public.deletion_queue 
        WHERE table_name = 'analytics_events' 
        AND deletion_type = 'hard' 
        AND status = 'pending'
        AND scheduled_at <= NOW()
    );
    
    GET DIAGNOSTICS records_count = ROW_COUNT;
    
    -- Update deletion queue status
    UPDATE public.deletion_queue 
    SET status = 'completed', processed_at = NOW()
    WHERE table_name = 'analytics_events' 
    AND deletion_type = 'hard' 
    AND status = 'pending'
    AND scheduled_at <= NOW();
    
    end_time := clock_timestamp();
    execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Log audit
    INSERT INTO public.data_retention_audit (
        operation, table_name, records_affected, execution_time_ms, status
    ) VALUES (
        'hard_delete', 'analytics_events', records_count, execution_time, 'completed'
    );
    
    RETURN QUERY SELECT 'analytics_events'::TEXT, records_count, execution_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process location data cleanup
CREATE OR REPLACE FUNCTION public.process_location_cleanup()
RETURNS TABLE(
    table_name TEXT,
    records_processed INTEGER,
    execution_time_ms INTEGER
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time INTEGER;
    records_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Clean up old location data (30+ days)
    DELETE FROM public.location_history 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS records_count = ROW_COUNT;
    
    end_time := clock_timestamp();
    execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Log audit
    INSERT INTO public.data_retention_audit (
        operation, table_name, records_affected, execution_time_ms, status
    ) VALUES (
        'location_cleanup', 'location_history', records_count, execution_time, 'completed'
    );
    
    RETURN QUERY SELECT 'location_history'::TEXT, records_count, execution_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process session cleanup
CREATE OR REPLACE FUNCTION public.process_session_cleanup()
RETURNS TABLE(
    table_name TEXT,
    records_processed INTEGER,
    execution_time_ms INTEGER
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time INTEGER;
    records_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Clean up expired sessions (2+ years)
    DELETE FROM public.session_data 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS records_count = ROW_COUNT;
    
    end_time := clock_timestamp();
    execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Log audit
    INSERT INTO public.data_retention_audit (
        operation, table_name, records_affected, execution_time_ms, status
    ) VALUES (
        'session_cleanup', 'session_data', records_count, execution_time, 'completed'
    );
    
    RETURN QUERY SELECT 'session_data'::TEXT, records_count, execution_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process security logs cleanup
CREATE OR REPLACE FUNCTION public.process_security_logs_cleanup()
RETURNS TABLE(
    table_name TEXT,
    records_processed INTEGER,
    execution_time_ms INTEGER
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time INTEGER;
    records_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Clean up old security logs (1+ year)
    DELETE FROM public.security_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS records_count = ROW_COUNT;
    
    end_time := clock_timestamp();
    execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Log audit
    INSERT INTO public.data_retention_audit (
        operation, table_name, records_affected, execution_time_ms, status
    ) VALUES (
        'security_logs_cleanup', 'security_logs', records_count, execution_time, 'completed'
    );
    
    RETURN QUERY SELECT 'security_logs'::TEXT, records_count, execution_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main data retention processor
CREATE OR REPLACE FUNCTION public.process_data_retention()
RETURNS TABLE(
    operation TEXT,
    table_name TEXT,
    records_processed INTEGER,
    execution_time_ms INTEGER,
    status TEXT
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    total_execution_time INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Process all retention operations
    RETURN QUERY
    SELECT 'soft_delete'::TEXT, * FROM public.process_soft_deletions()
    UNION ALL
    SELECT 'hard_delete'::TEXT, * FROM public.process_hard_deletions()
    UNION ALL
    SELECT 'location_cleanup'::TEXT, * FROM public.process_location_cleanup()
    UNION ALL
    SELECT 'session_cleanup'::TEXT, * FROM public.process_session_cleanup()
    UNION ALL
    SELECT 'security_logs_cleanup'::TEXT, * FROM public.process_security_logs_cleanup();
    
    end_time := clock_timestamp();
    total_execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Update last run timestamp
    UPDATE public.data_retention_config 
    SET last_run = NOW(), updated_at = NOW()
    WHERE enabled = true;
    
    -- Log overall execution
    INSERT INTO public.data_retention_audit (
        operation, table_name, records_affected, execution_time_ms, status
    ) VALUES (
        'data_retention_processor', 'all_tables', 0, total_execution_time, 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get retention statistics
CREATE OR REPLACE FUNCTION public.get_retention_statistics()
RETURNS TABLE(
    table_name TEXT,
    total_records BIGINT,
    records_to_delete BIGINT,
    retention_days INTEGER,
    last_cleanup TIMESTAMPTZ,
    next_cleanup TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        drc.table_name,
        CASE 
            WHEN drc.table_name = 'users' THEN (SELECT COUNT(*) FROM public.users)
            WHEN drc.table_name = 'jobs' THEN (SELECT COUNT(*) FROM public.jobs)
            WHEN drc.table_name = 'payments' THEN (SELECT COUNT(*) FROM public.payments)
            WHEN drc.table_name = 'analytics_events' THEN (SELECT COUNT(*) FROM public.analytics_events)
            WHEN drc.table_name = 'location_history' THEN (SELECT COUNT(*) FROM public.location_history)
            ELSE 0
        END as total_records,
        CASE 
            WHEN drc.table_name = 'analytics_events' THEN (
                SELECT COUNT(*) FROM public.analytics_events 
                WHERE ts < NOW() - INTERVAL '1 day' * drc.retention_days
            )
            WHEN drc.table_name = 'location_history' THEN (
                SELECT COUNT(*) FROM public.location_history 
                WHERE created_at < NOW() - INTERVAL '1 day' * drc.retention_days
            )
            ELSE 0
        END as records_to_delete,
        drc.retention_days,
        drc.last_run,
        COALESCE(drc.last_run + INTERVAL '1 day', NOW()) as next_cleanup
    FROM public.data_retention_config drc
    WHERE drc.enabled = true
    ORDER BY drc.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually trigger data retention for a specific table
CREATE OR REPLACE FUNCTION public.trigger_retention_for_table(p_table_name TEXT)
RETURNS TABLE(
    operation TEXT,
    records_processed INTEGER,
    execution_time_ms INTEGER,
    status TEXT
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time INTEGER;
    records_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Process based on table name
    CASE p_table_name
        WHEN 'users' THEN
            SELECT * INTO records_count, execution_time FROM public.process_soft_deletions();
        WHEN 'analytics_events' THEN
            SELECT * INTO records_count, execution_time FROM public.process_hard_deletions();
        WHEN 'location_history' THEN
            SELECT * INTO records_count, execution_time FROM public.process_location_cleanup();
        WHEN 'session_data' THEN
            SELECT * INTO records_count, execution_time FROM public.process_session_cleanup();
        WHEN 'security_logs' THEN
            SELECT * INTO records_count, execution_time FROM public.process_security_logs_cleanup();
        ELSE
            RAISE EXCEPTION 'Unknown table: %', p_table_name;
    END CASE;
    
    end_time := clock_timestamp();
    execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        'manual_trigger'::TEXT,
        records_count,
        execution_time,
        'completed'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job function (to be called by cron)
CREATE OR REPLACE FUNCTION public.scheduled_data_retention()
RETURNS VOID AS $$
BEGIN
    -- Run data retention processor
    PERFORM * FROM public.process_data_retention();
    
    -- Log successful execution
    INSERT INTO public.data_retention_audit (
        operation, table_name, records_affected, execution_time_ms, status
    ) VALUES (
        'scheduled_retention', 'all_tables', 0, 0, 'completed'
    );
    
    RAISE NOTICE 'Data retention job completed successfully';
EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO public.data_retention_audit (
        operation, table_name, records_affected, execution_time_ms, status, error_message
    ) VALUES (
        'scheduled_retention', 'all_tables', 0, 0, 'failed', SQLERRM
    );
    
    RAISE NOTICE 'Data retention job failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.add_to_deletion_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_data_retention TO service_role;
GRANT EXECUTE ON FUNCTION public.get_retention_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_retention_for_table TO service_role;
GRANT EXECUTE ON FUNCTION public.scheduled_data_retention TO service_role;

-- Create view for monitoring
CREATE OR REPLACE VIEW public.retention_monitoring AS
SELECT 
    drc.table_name,
    drc.retention_days,
    drc.enabled,
    drc.last_run,
    COALESCE(dra.records_affected, 0) as last_cleanup_records,
    COALESCE(dra.execution_time_ms, 0) as last_cleanup_time_ms,
    dra.status as last_cleanup_status,
    dra.executed_at as last_cleanup_time
FROM public.data_retention_config drc
LEFT JOIN LATERAL (
    SELECT records_affected, execution_time_ms, status, executed_at
    FROM public.data_retention_audit
    WHERE table_name = drc.table_name
    ORDER BY executed_at DESC
    LIMIT 1
) dra ON true
ORDER BY drc.table_name;

-- Grant access to monitoring view
GRANT SELECT ON public.retention_monitoring TO authenticated;





