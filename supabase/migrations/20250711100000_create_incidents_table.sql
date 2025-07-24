
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    guard_id UUID NOT NULL REFERENCES auth.users(id),
    client_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High')),
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guards can insert their own incident reports" 
ON incidents
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'guard'
    AND guard_id = auth.uid()
);

CREATE POLICY "Clients can view incident reports for their jobs" 
ON incidents
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'client'
    AND client_id = auth.uid()
);

CREATE POLICY "Guards can view incident reports they have submitted" 
ON incidents
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'guard'
    AND guard_id = auth.uid()
);
