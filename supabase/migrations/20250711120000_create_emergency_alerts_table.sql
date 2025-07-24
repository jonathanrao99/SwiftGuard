
CREATE TABLE emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    guard_id UUID NOT NULL REFERENCES auth.users(id),
    client_id UUID REFERENCES auth.users(id),
    alert_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location_latitude DOUBLE PRECISION,
    location_longitude DOUBLE PRECISION,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    notes TEXT
);

ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guards can insert emergency alerts" 
ON emergency_alerts
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'guard'
    AND guard_id = auth.uid()
);

CREATE POLICY "Clients can view emergency alerts for their jobs" 
ON emergency_alerts
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'client'
    AND client_id = auth.uid()
);

CREATE POLICY "Guards can view their own emergency alerts" 
ON emergency_alerts
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'guard'
    AND guard_id = auth.uid()
);

CREATE POLICY "Clients can update status of emergency alerts for their jobs" 
ON emergency_alerts
FOR UPDATE
TO authenticated
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'client'
    AND client_id = auth.uid()
);
