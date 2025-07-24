-- Create jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  pay numeric NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  num_guards integer NOT NULL CHECK (num_guards > 0),
  status text NOT NULL DEFAULT 'open', -- open, paid, in_progress, completed, cancelled
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create job_guards table (many-to-many: jobs <-> guards)
CREATE TABLE public.job_guards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  guard_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, completed
  assigned_at timestamptz DEFAULT now(),
  UNIQUE (job_id, guard_id)
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_guards ENABLE ROW LEVEL SECURITY;

-- Policies for jobs
-- Clients can manage their own jobs
CREATE POLICY "Clients can view their jobs" ON public.jobs FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "Clients can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());
CREATE POLICY "Clients can update their jobs" ON public.jobs FOR UPDATE TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
CREATE POLICY "Clients can delete their jobs" ON public.jobs FOR DELETE TO authenticated USING (client_id = auth.uid());
-- Guards can view available jobs (status = 'open' or 'paid')
CREATE POLICY "Guards can view available jobs" ON public.jobs FOR SELECT TO authenticated USING (status IN ('open', 'paid'));

-- Policies for job_guards
-- Guards can view and accept jobs for themselves
CREATE POLICY "Guards can view their job_guards" ON public.job_guards FOR SELECT TO authenticated USING (guard_id = auth.uid());
CREATE POLICY "Guards can insert job_guards for themselves" ON public.job_guards FOR INSERT TO authenticated WITH CHECK (guard_id = auth.uid());
CREATE POLICY "Guards can update their job_guards" ON public.job_guards FOR UPDATE TO authenticated USING (guard_id = auth.uid()) WITH CHECK (guard_id = auth.uid());
-- Clients can view job_guards for their jobs
CREATE POLICY "Clients can view job_guards for their jobs" ON public.job_guards FOR SELECT TO authenticated USING (job_id IN (SELECT id FROM public.jobs WHERE client_id = auth.uid())); 