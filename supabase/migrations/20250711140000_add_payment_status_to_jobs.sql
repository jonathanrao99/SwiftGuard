
ALTER TABLE jobs
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN payment_intent_id TEXT;
