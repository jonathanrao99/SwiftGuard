
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    receiver_id UUID NOT NULL REFERENCES auth.users(id),
    job_id UUID REFERENCES jobs(id), -- Optional: if messages are job-specific
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert messages
CREATE POLICY "Users can send messages" 
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
);

-- Policy for users to view messages they are part of
CREATE POLICY "Users can view their messages" 
ON messages
FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
);
