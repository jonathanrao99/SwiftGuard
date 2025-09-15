-- SwiftGuard Experiments and A/B Testing
-- Provides experiment assignment and tracking capabilities

-- Create experiments table
CREATE TABLE IF NOT EXISTS public.experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_key TEXT NOT NULL UNIQUE,
    experiment_name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'guards', 'clients', 'admins')),
    traffic_allocation INTEGER DEFAULT 100 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100),
    variants JSONB NOT NULL DEFAULT '[]',
    success_metrics JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Create experiment assignments table
CREATE TABLE IF NOT EXISTS public.experiment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    experiment_key TEXT NOT NULL,
    variant TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, experiment_key)
);

-- Create experiment events table
CREATE TABLE IF NOT EXISTS public.experiment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    experiment_key TEXT NOT NULL,
    variant TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_properties JSONB DEFAULT '{}',
    session_id TEXT,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create experiment results table
CREATE TABLE IF NOT EXISTS public.experiment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_key TEXT NOT NULL,
    variant TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    user_count INTEGER NOT NULL,
    event_count INTEGER NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    UNIQUE(experiment_key, variant, metric_name, period_start, period_end)
);

-- Insert default experiments
INSERT INTO public.experiments (experiment_key, experiment_name, description, status, target_audience, variants, success_metrics) VALUES
    ('pricing_ui_v1', 'Pricing UI Experiment', 'Test different pricing display formats', 'draft', 'clients', 
     '[{"key": "control", "name": "Current UI", "description": "Current pricing display"}, {"key": "variant_a", "name": "Simplified UI", "description": "Simplified pricing display"}]',
     '[{"name": "conversion_rate", "description": "Job booking conversion rate"}, {"name": "time_to_book", "description": "Time from view to booking"}]'),
    
    ('guard_matching_v1', 'Guard Matching Algorithm', 'Test different guard matching algorithms', 'draft', 'clients',
     '[{"key": "control", "name": "Distance-based", "description": "Match by distance only"}, {"key": "variant_a", "name": "Rating + Distance", "description": "Match by rating and distance"}]',
     '[{"name": "acceptance_rate", "description": "Guard acceptance rate"}, {"name": "client_satisfaction", "description": "Client satisfaction score"}]'),
    
    ('notification_timing_v1', 'Notification Timing', 'Test different notification timing strategies', 'draft', 'all',
     '[{"key": "control", "name": "Immediate", "description": "Send notifications immediately"}, {"key": "variant_a", "name": "Batched", "description": "Send notifications in batches"}]',
     '[{"name": "engagement_rate", "description": "Notification engagement rate"}, {"name": "response_time", "description": "Average response time"}]')
ON CONFLICT (experiment_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_experiments_key ON public.experiments (experiment_key);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON public.experiments (status);
CREATE INDEX IF NOT EXISTS idx_experiments_active ON public.experiments (is_active);

CREATE INDEX IF NOT EXISTS idx_experiment_assignments_user_id ON public.experiment_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment_key ON public.experiment_assignments (experiment_key);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_active ON public.experiment_assignments (is_active);

CREATE INDEX IF NOT EXISTS idx_experiment_events_user_id ON public.experiment_events (user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_events_experiment_key ON public.experiment_events (experiment_key);
CREATE INDEX IF NOT EXISTS idx_experiment_events_event_name ON public.experiment_events (event_name);
CREATE INDEX IF NOT EXISTS idx_experiment_events_occurred_at ON public.experiment_events (occurred_at);

CREATE INDEX IF NOT EXISTS idx_experiment_results_experiment_key ON public.experiment_results (experiment_key);
CREATE INDEX IF NOT EXISTS idx_experiment_results_variant ON public.experiment_results (variant);
CREATE INDEX IF NOT EXISTS idx_experiment_results_metric_name ON public.experiment_results (metric_name);
CREATE INDEX IF NOT EXISTS idx_experiment_results_calculated_at ON public.experiment_results (calculated_at);

-- Enable RLS on all tables
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for experiments (admin only)
CREATE POLICY "Admin can manage experiments" ON public.experiments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for experiment_assignments (users can view own assignments)
CREATE POLICY "Users can view own experiment assignments" ON public.experiment_assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage experiment assignments" ON public.experiment_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for experiment_events (users can insert own events)
CREATE POLICY "Users can insert own experiment events" ON public.experiment_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all experiment events" ON public.experiment_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for experiment_results (admin only)
CREATE POLICY "Admin can view experiment results" ON public.experiment_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to assign user to experiment
CREATE OR REPLACE FUNCTION public.assign_user_to_experiment(
    p_user_id UUID,
    p_experiment_key TEXT,
    p_variant TEXT DEFAULT NULL
)
RETURNS TABLE(
    experiment_key TEXT,
    variant TEXT,
    assigned BOOLEAN
) AS $$
DECLARE
    experiment_record RECORD;
    target_variant TEXT;
    traffic_allocation INTEGER;
    user_hash INTEGER;
    assignment_exists BOOLEAN;
BEGIN
    -- Get experiment details
    SELECT * INTO experiment_record
    FROM public.experiments
    WHERE experiment_key = p_experiment_key
    AND status = 'active'
    AND is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW());

    IF NOT FOUND THEN
        RETURN QUERY SELECT p_experiment_key, NULL::TEXT, false;
        RETURN;
    END IF;

    -- Check if user is already assigned
    SELECT EXISTS(
        SELECT 1 FROM public.experiment_assignments
        WHERE user_id = p_user_id
        AND experiment_key = p_experiment_key
        AND is_active = true
    ) INTO assignment_exists;

    IF assignment_exists THEN
        -- Return existing assignment
        SELECT variant INTO target_variant
        FROM public.experiment_assignments
        WHERE user_id = p_user_id
        AND experiment_key = p_experiment_key
        AND is_active = true;
        
        RETURN QUERY SELECT p_experiment_key, target_variant, true;
        RETURN;
    END IF;

    -- Check traffic allocation
    traffic_allocation := experiment_record.traffic_allocation;
    
    -- Generate consistent hash for user
    user_hash := abs(hashtext(p_user_id::TEXT || p_experiment_key)) % 100;
    
    IF user_hash >= traffic_allocation THEN
        -- User not in traffic allocation
        RETURN QUERY SELECT p_experiment_key, NULL::TEXT, false;
        RETURN;
    END IF;

    -- Assign variant
    IF p_variant IS NOT NULL THEN
        -- Check if variant exists in experiment
        IF NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(experiment_record.variants) AS v
            WHERE v->>'key' = p_variant
        ) THEN
            RETURN QUERY SELECT p_experiment_key, NULL::TEXT, false;
            RETURN;
        END IF;
        target_variant := p_variant;
    ELSE
        -- Randomly assign variant
        SELECT v->>'key' INTO target_variant
        FROM jsonb_array_elements(experiment_record.variants) AS v
        ORDER BY random()
        LIMIT 1;
    END IF;

    -- Create assignment
    INSERT INTO public.experiment_assignments (user_id, experiment_key, variant)
    VALUES (p_user_id, p_experiment_key, target_variant);

    RETURN QUERY SELECT p_experiment_key, target_variant, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's experiment assignments
CREATE OR REPLACE FUNCTION public.get_user_experiment_assignments(p_user_id UUID)
RETURNS TABLE(
    experiment_key TEXT,
    variant TEXT,
    assigned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.experiment_key,
        ea.variant,
        ea.assigned_at,
        ea.expires_at
    FROM public.experiment_assignments ea
    WHERE ea.user_id = p_user_id
    AND ea.is_active = true
    AND (ea.expires_at IS NULL OR ea.expires_at > NOW())
    ORDER BY ea.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track experiment event
CREATE OR REPLACE FUNCTION public.track_experiment_event(
    p_user_id UUID,
    p_experiment_key TEXT,
    p_event_name TEXT,
    p_event_properties JSONB DEFAULT '{}',
    p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_variant TEXT;
BEGIN
    -- Get user's variant for this experiment
    SELECT variant INTO user_variant
    FROM public.experiment_assignments
    WHERE user_id = p_user_id
    AND experiment_key = p_experiment_key
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

    IF user_variant IS NULL THEN
        RETURN false;
    END IF;

    -- Insert event
    INSERT INTO public.experiment_events (
        user_id,
        experiment_key,
        variant,
        event_name,
        event_properties,
        session_id
    ) VALUES (
        p_user_id,
        p_experiment_key,
        user_variant,
        p_event_name,
        p_event_properties,
        p_session_id
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate experiment results
CREATE OR REPLACE FUNCTION public.calculate_experiment_results(
    p_experiment_key TEXT,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ
)
RETURNS TABLE(
    variant TEXT,
    metric_name TEXT,
    metric_value NUMERIC,
    user_count INTEGER,
    event_count INTEGER
) AS $$
DECLARE
    experiment_record RECORD;
    variant_record RECORD;
    metric_record RECORD;
BEGIN
    -- Get experiment details
    SELECT * INTO experiment_record
    FROM public.experiments
    WHERE experiment_key = p_experiment_key;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Calculate results for each variant and metric
    FOR variant_record IN 
        SELECT v->>'key' as variant_key
        FROM jsonb_array_elements(experiment_record.variants) AS v
    LOOP
        FOR metric_record IN
            SELECT m->>'name' as metric_name
            FROM jsonb_array_elements(experiment_record.success_metrics) AS m
        LOOP
            -- Calculate metric value based on metric name
            CASE metric_record.metric_name
                WHEN 'conversion_rate' THEN
                    RETURN QUERY
                    SELECT 
                        variant_record.variant_key,
                        metric_record.metric_name,
                        CASE 
                            WHEN COUNT(DISTINCT ea.user_id) > 0 
                            THEN (COUNT(DISTINCT CASE WHEN ee.event_name = 'job_booked' THEN ee.user_id END)::NUMERIC / COUNT(DISTINCT ea.user_id)::NUMERIC) * 100
                            ELSE 0
                        END as metric_value,
                        COUNT(DISTINCT ea.user_id)::INTEGER as user_count,
                        COUNT(ee.id)::INTEGER as event_count
                    FROM public.experiment_assignments ea
                    LEFT JOIN public.experiment_events ee ON ee.user_id = ea.user_id 
                        AND ee.experiment_key = ea.experiment_key
                        AND ee.occurred_at BETWEEN p_period_start AND p_period_end
                    WHERE ea.experiment_key = p_experiment_key
                    AND ea.variant = variant_record.variant_key
                    AND ea.is_active = true;

                WHEN 'acceptance_rate' THEN
                    RETURN QUERY
                    SELECT 
                        variant_record.variant_key,
                        metric_record.metric_name,
                        CASE 
                            WHEN COUNT(DISTINCT ea.user_id) > 0 
                            THEN (COUNT(DISTINCT CASE WHEN ee.event_name = 'guard_accepted' THEN ee.user_id END)::NUMERIC / COUNT(DISTINCT ea.user_id)::NUMERIC) * 100
                            ELSE 0
                        END as metric_value,
                        COUNT(DISTINCT ea.user_id)::INTEGER as user_count,
                        COUNT(ee.id)::INTEGER as event_count
                    FROM public.experiment_assignments ea
                    LEFT JOIN public.experiment_events ee ON ee.user_id = ea.user_id 
                        AND ee.experiment_key = ea.experiment_key
                        AND ee.occurred_at BETWEEN p_period_start AND p_period_end
                    WHERE ea.experiment_key = p_experiment_key
                    AND ea.variant = variant_record.variant_key
                    AND ea.is_active = true;

                ELSE
                    -- Default metric calculation
                    RETURN QUERY
                    SELECT 
                        variant_record.variant_key,
                        metric_record.metric_name,
                        COUNT(ee.id)::NUMERIC as metric_value,
                        COUNT(DISTINCT ea.user_id)::INTEGER as user_count,
                        COUNT(ee.id)::INTEGER as event_count
                    FROM public.experiment_assignments ea
                    LEFT JOIN public.experiment_events ee ON ee.user_id = ea.user_id 
                        AND ee.experiment_key = ea.experiment_key
                        AND ee.occurred_at BETWEEN p_period_start AND p_period_end
                    WHERE ea.experiment_key = p_experiment_key
                    AND ea.variant = variant_record.variant_key
                    AND ea.is_active = true;
            END CASE;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get experiment summary
CREATE OR REPLACE FUNCTION public.get_experiment_summary(p_experiment_key TEXT)
RETURNS TABLE(
    experiment_key TEXT,
    experiment_name TEXT,
    status TEXT,
    total_users INTEGER,
    variants JSONB,
    success_metrics JSONB,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.experiment_key,
        e.experiment_name,
        e.status,
        COUNT(DISTINCT ea.user_id)::INTEGER as total_users,
        e.variants,
        e.success_metrics,
        e.start_date,
        e.end_date
    FROM public.experiments e
    LEFT JOIN public.experiment_assignments ea ON ea.experiment_key = e.experiment_key
        AND ea.is_active = true
    WHERE e.experiment_key = p_experiment_key
    GROUP BY e.experiment_key, e.experiment_name, e.status, e.variants, e.success_metrics, e.start_date, e.end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.assign_user_to_experiment TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_experiment_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_experiment_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_experiment_results TO service_role;
GRANT EXECUTE ON FUNCTION public.get_experiment_summary TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_experiments_updated_at
    BEFORE UPDATE ON public.experiments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for experiment dashboard
CREATE OR REPLACE VIEW public.experiment_dashboard AS
SELECT 
    e.experiment_key,
    e.experiment_name,
    e.status,
    e.target_audience,
    e.traffic_allocation,
    e.start_date,
    e.end_date,
    COUNT(DISTINCT ea.user_id) as total_users,
    COUNT(DISTINCT ee.id) as total_events,
    e.created_at,
    u.full_name as created_by_name
FROM public.experiments e
LEFT JOIN public.experiment_assignments ea ON ea.experiment_key = e.experiment_key
    AND ea.is_active = true
LEFT JOIN public.experiment_events ee ON ee.experiment_key = e.experiment_key
LEFT JOIN public.users u ON u.id = e.created_by
GROUP BY e.experiment_key, e.experiment_name, e.status, e.target_audience, e.traffic_allocation, e.start_date, e.end_date, e.created_at, u.full_name
ORDER BY e.created_at DESC;

-- Grant access to dashboard view
GRANT SELECT ON public.experiment_dashboard TO authenticated;





