-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'job_posted', 'job_accepted', 'job_rejected', 'job_started', 
    'job_completed', 'incident_reported', 'payment_received', 
    'message_received', 'emergency_alert', 'check_in_reminder', 
    'check_out_reminder'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user push tokens table
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'job_posted', 'job_accepted', 'job_rejected', 'job_started', 
    'job_completed', 'incident_reported', 'payment_received', 
    'message_received', 'emergency_alert', 'check_in_reminder', 
    'check_out_reminder'
  )),
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE CHECK (type IN (
    'job_posted', 'job_accepted', 'job_rejected', 'job_started', 
    'job_completed', 'incident_reported', 'payment_received', 
    'message_received', 'emergency_alert', 'check_in_reminder', 
    'check_out_reminder'
  )),
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  default_priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notification logs table for debugging
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('push', 'email', 'sms', 'in_app')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  metadata JSONB
);

-- Enable RLS on all tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policies for user_push_tokens table
CREATE POLICY "Users can view their own push tokens"
  ON public.user_push_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own push tokens"
  ON public.user_push_tokens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for notification_preferences table
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own notification preferences"
  ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for notification_templates table (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view notification templates"
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for notification_logs table
CREATE POLICY "Users can view their own notification logs"
  ON public.notification_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert notification logs"
  ON public.notification_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_notifications_priority ON public.notifications(priority);

CREATE INDEX idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX idx_user_push_tokens_token ON public.user_push_tokens(push_token);
CREATE INDEX idx_user_push_tokens_active ON public.user_push_tokens(is_active);

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_type ON public.notification_preferences(type);

CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_notification_logs_sent_at ON public.notification_logs(sent_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_push_tokens_updated_at
  BEFORE UPDATE ON public.user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification templates
INSERT INTO public.notification_templates (type, title_template, body_template, default_priority) VALUES
('job_posted', 'New Job Available', 'A new security job has been posted: {job_title} at {location}', 'high'),
('job_accepted', 'Job Accepted', 'Your job "{job_title}" has been accepted by {guard_name}', 'medium'),
('job_rejected', 'Job Rejected', 'Your job "{job_title}" was rejected by {guard_name}', 'low'),
('job_started', 'Job Started', 'Your security job "{job_title}" has started', 'medium'),
('job_completed', 'Job Completed', 'Your security job "{job_title}" has been completed', 'medium'),
('incident_reported', 'Incident Reported', 'An incident has been reported for job "{job_title}"', 'critical'),
('payment_received', 'Payment Received', 'Payment of ${amount} has been received for job "{job_title}"', 'medium'),
('message_received', 'New Message', 'You have a new message from {sender_name}', 'medium'),
('emergency_alert', 'EMERGENCY ALERT', 'Emergency situation at {location}. Please respond immediately.', 'critical'),
('check_in_reminder', 'Check-in Reminder', 'Please check in for your job "{job_title}" starting in 30 minutes', 'high'),
('check_out_reminder', 'Check-out Reminder', 'Your job "{job_title}" ends in 30 minutes. Please prepare to check out.', 'high')
ON CONFLICT (type) DO NOTHING;

-- Insert default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id, type, push_enabled, email_enabled, sms_enabled, in_app_enabled)
  SELECT 
    NEW.id,
    template.type,
    CASE 
      WHEN template.type IN ('emergency_alert', 'incident_reported') THEN true
      WHEN template.type IN ('job_posted', 'job_accepted', 'job_started', 'job_completed') THEN true
      ELSE false
    END as push_enabled,
    false as email_enabled,
    false as sms_enabled,
    true as in_app_enabled
  FROM public.notification_templates template
  WHERE template.is_active = true;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically create notification preferences for new users
CREATE TRIGGER create_user_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Create function to send notifications
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT NULL,
  p_priority TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_template public.notification_templates%ROWTYPE;
BEGIN
  -- Get notification template
  SELECT * INTO v_template 
  FROM public.notification_templates 
  WHERE type = p_type AND is_active = true;
  
  -- Use template if available, otherwise use provided values
  IF v_template IS NOT NULL THEN
    p_title := COALESCE(p_title, v_template.title_template);
    p_body := COALESCE(p_body, v_template.body_template);
    p_priority := COALESCE(p_priority, v_template.default_priority);
  END IF;
  
  -- Insert notification
  INSERT INTO public.notifications (user_id, type, title, body, data, priority)
  VALUES (p_user_id, p_type, p_title, p_body, p_data, p_priority)
  RETURNING id INTO v_notification_id;
  
  -- Log notification
  INSERT INTO public.notification_logs (notification_id, user_id, type, delivery_method, status, metadata)
  VALUES (v_notification_id, p_user_id, p_type, 'in_app', 'sent', jsonb_build_object('priority', p_priority));
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT SELECT ON public.notification_templates TO authenticated;
GRANT SELECT ON public.notification_logs TO authenticated;

-- Grant service role permissions
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.user_push_tokens TO service_role;
GRANT ALL ON public.notification_preferences TO service_role;
GRANT ALL ON public.notification_templates TO service_role;
GRANT ALL ON public.notification_logs TO service_role;
GRANT EXECUTE ON FUNCTION send_notification TO service_role;

