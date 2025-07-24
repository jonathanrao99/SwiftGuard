-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  venue_type TEXT NOT NULL,
  custom_venue_type TEXT,
  recurring_mode TEXT NOT NULL,
  recurring_pattern_type TEXT,
  event_dates JSONB NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration DECIMAL(5,2) NOT NULL,
  num_guards INTEGER NOT NULL,
  hourly_pay DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  requirements JSONB,
  other_requirement TEXT,
  manager_name TEXT NOT NULL,
  manager_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create job_guards table for guard assignments
CREATE TABLE IF NOT EXISTS public.job_guards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  guard_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, guard_id)
);

-- Create RLS policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_guards ENABLE ROW LEVEL SECURITY;

-- Allow clients to view their own jobs
CREATE POLICY "Clients can view their own jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Allow guards to view available jobs
CREATE POLICY "Guards can view available jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'guard'
    )
    AND status = 'paid'
  );

-- Allow clients to create jobs
CREATE POLICY "Clients can create jobs"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'client'
    )
  );

-- Allow clients to update their own jobs
CREATE POLICY "Clients can update their own jobs"
  ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Allow guards to view their assignments
CREATE POLICY "Guards can view their assignments"
  ON public.job_guards
  FOR SELECT
  TO authenticated
  USING (
    guard_id = auth.uid()
    OR auth.uid() IN (
      SELECT client_id FROM public.jobs WHERE id = job_id
    )
  );

-- Allow guards to accept/reject jobs
CREATE POLICY "Guards can accept or reject jobs"
  ON public.job_guards
  FOR UPDATE
  TO authenticated
  USING (guard_id = auth.uid())
  WITH CHECK (guard_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for jobs
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at for job_guards
CREATE TRIGGER update_job_guards_updated_at
  BEFORE UPDATE ON public.job_guards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster job searches
CREATE INDEX jobs_status_idx ON public.jobs(status);
CREATE INDEX job_guards_status_idx ON public.job_guards(status);
CREATE INDEX job_guards_guard_id_idx ON public.job_guards(guard_id);
CREATE INDEX job_guards_job_id_idx ON public.job_guards(job_id); 