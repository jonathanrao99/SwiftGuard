-- Security Features Migration for SwiftGuard
-- Adds incident reporting, tracking, checkpoints, and emergency features

-- Add security-specific fields to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS current_location JSONB,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS battery_level INTEGER,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Add security-specific fields to existing jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS geofence JSONB,
ADD COLUMN IF NOT EXISTS checkpoint_locations JSONB,
ADD COLUMN IF NOT EXISTS emergency_procedures TEXT,
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'medium';

-- Add check-in/check-out fields to job_guards table
ALTER TABLE public.job_guards 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS performance_rating INTEGER,
ADD COLUMN IF NOT EXISTS client_feedback TEXT,
ADD COLUMN IF NOT EXISTS guard_notes TEXT;

-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('theft', 'vandalism', 'trespassing', 'medical', 'fire', 'suspicious_activity', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB NOT NULL,
  photos JSONB,
  witnesses TEXT[],
  police_notified BOOLEAN DEFAULT false,
  police_case_number TEXT,
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create shift checkpoints table
CREATE TABLE IF NOT EXISTS public.shift_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  photo_url TEXT,
  notes TEXT,
  location JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create guard tracking table for real-time location
CREATE TABLE IF NOT EXISTS public.guard_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  battery_level INTEGER,
  is_online BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create emergency alerts table
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('panic', 'medical', 'security_breach', 'fire', 'other')),
  location JSONB NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'responding', 'resolved')),
  response_time INTEGER, -- in seconds
  responders TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create messages table for guard-client communication
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'location', 'emergency')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('job_assigned', 'emergency', 'incident', 'check_in_reminder', 'payment', 'system')),
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS incidents_guard_id_idx ON public.incidents(guard_id);
CREATE INDEX IF NOT EXISTS incidents_job_id_idx ON public.incidents(job_id);
CREATE INDEX IF NOT EXISTS incidents_status_idx ON public.incidents(status);
CREATE INDEX IF NOT EXISTS incidents_created_at_idx ON public.incidents(created_at);

CREATE INDEX IF NOT EXISTS shift_checkpoints_guard_id_idx ON public.shift_checkpoints(guard_id);
CREATE INDEX IF NOT EXISTS shift_checkpoints_job_id_idx ON public.shift_checkpoints(job_id);
CREATE INDEX IF NOT EXISTS shift_checkpoints_checked_at_idx ON public.shift_checkpoints(checked_at);

CREATE INDEX IF NOT EXISTS guard_tracking_guard_id_idx ON public.guard_tracking(guard_id);
CREATE INDEX IF NOT EXISTS guard_tracking_job_id_idx ON public.guard_tracking(job_id);
CREATE INDEX IF NOT EXISTS guard_tracking_created_at_idx ON public.guard_tracking(created_at);

CREATE INDEX IF NOT EXISTS emergency_alerts_guard_id_idx ON public.emergency_alerts(guard_id);
CREATE INDEX IF NOT EXISTS emergency_alerts_status_idx ON public.emergency_alerts(status);
CREATE INDEX IF NOT EXISTS emergency_alerts_created_at_idx ON public.emergency_alerts(created_at);

CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_job_id_idx ON public.messages(job_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

-- Enable Row Level Security
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guard_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incidents
CREATE POLICY "Guards can view their own incidents"
  ON public.incidents FOR SELECT
  TO authenticated
  USING (guard_id = auth.uid());

CREATE POLICY "Clients can view incidents for their jobs"
  ON public.incidents FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM public.jobs WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Guards can create incidents"
  ON public.incidents FOR INSERT
  TO authenticated
  WITH CHECK (
    guard_id = auth.uid()
    AND auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'guard'
    )
  );

-- RLS Policies for checkpoints
CREATE POLICY "Guards can manage their checkpoints"
  ON public.shift_checkpoints FOR ALL
  TO authenticated
  USING (guard_id = auth.uid())
  WITH CHECK (guard_id = auth.uid());

CREATE POLICY "Clients can view checkpoints for their jobs"
  ON public.shift_checkpoints FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM public.jobs WHERE client_id = auth.uid()
    )
  );

-- RLS Policies for tracking
CREATE POLICY "Guards can manage their tracking"
  ON public.guard_tracking FOR ALL
  TO authenticated
  USING (guard_id = auth.uid())
  WITH CHECK (guard_id = auth.uid());

CREATE POLICY "Clients can view tracking for their jobs"
  ON public.guard_tracking FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM public.jobs WHERE client_id = auth.uid()
    )
  );

-- RLS Policies for emergency alerts
CREATE POLICY "Guards can create emergency alerts"
  ON public.emergency_alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    guard_id = auth.uid()
    AND auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'guard'
    )
  );

CREATE POLICY "Users can view relevant emergency alerts"
  ON public.emergency_alerts FOR SELECT
  TO authenticated
  USING (
    guard_id = auth.uid()
    OR job_id IN (
      SELECT id FROM public.jobs WHERE client_id = auth.uid()
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to send emergency notifications
CREATE OR REPLACE FUNCTION notify_emergency_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for client if job exists
  IF NEW.job_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, data)
    SELECT 
      jobs.client_id,
      'EMERGENCY ALERT',
      'Emergency alert from guard ' || users.first_name || ' ' || users.last_name,
      'emergency',
      jsonb_build_object('alert_id', NEW.id, 'guard_id', NEW.guard_id)
    FROM public.jobs
    JOIN public.users ON users.id = NEW.guard_id
    WHERE jobs.id = NEW.job_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for emergency notifications
CREATE TRIGGER emergency_alert_notification
  AFTER INSERT ON public.emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_emergency_alert(); 