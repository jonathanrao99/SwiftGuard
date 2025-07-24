
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    guard_id UUID NOT NULL REFERENCES auth.users(id),
    client_id UUID NOT NULL REFERENCES auth.users(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, guard_id, client_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can insert their own reviews"
ON reviews
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'client'
    AND client_id = auth.uid()
);

CREATE POLICY "Users can view reviews"
ON reviews
FOR SELECT
TO authenticated
USING (true);
