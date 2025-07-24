-- Add security-focused features to the database

-- Create incidents table for incident reporting
CREATE TABLE IF NOT EXISTS incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  guard_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('security_breach', 'medical_emergency', 'fire', 'theft', 'disturbance', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_photos TEXT[],
  evidence_videos TEXT[],
  witnesses TEXT[],
  police_involved BOOLEAN DEFAULT FALSE,
  police_report_number TEXT,
  medical_attention_required BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shift checkpoints table for location verification
CREATE TABLE IF NOT EXISTS shift_checkpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  guard_id UUID REFERENCES users(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_url TEXT,
  notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create guard tracking table for real-time GPS tracking
CREATE TABLE IF NOT EXISTS guard_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guard_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  battery_level INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table for real-time communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'location', 'emergency')),
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create emergency alerts table for panic button functionality
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guard_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('panic', 'medical', 'security', 'assistance')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_time INTEGER, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create training records table
CREATE TABLE IF NOT EXISTS training_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guard_id UUID REFERENCES users(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  training_type TEXT NOT NULL CHECK (training_type IN ('certification', 'refresher', 'mandatory', 'optional')),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  score DECIMAL(5, 2),
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create equipment assignments table
CREATE TABLE IF NOT EXISTS equipment_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guard_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL,
  equipment_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  condition_assigned TEXT,
  condition_returned TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create compliance tracking table
CREATE TABLE IF NOT EXISTS compliance_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guard_id UUID REFERENCES users(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('current', 'expiring_soon', 'expired', 'not_applicable')),
  document_url TEXT,
  expires_at TIMESTAMPTZ,
  last_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add additional fields to existing tables

-- Extend jobs table with security-specific fields
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS priority_level TEXT CHECK (priority_level IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS geofence_radius INTEGER DEFAULT 100; -- meters
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requires_check_in BOOLEAN DEFAULT TRUE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requires_hourly_checkin BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_onsite_contact TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS risk_assessment TEXT;

-- Extend job_guards table with additional tracking fields
ALTER TABLE job_guards ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE job_guards ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ;
ALTER TABLE job_guards ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE job_guards ADD COLUMN IF NOT EXISTS shift_notes TEXT;
ALTER TABLE job_guards ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3, 2);
ALTER TABLE job_guards ADD COLUMN IF NOT EXISTS incident_count INTEGER DEFAULT 0;
ALTER TABLE job_guards ADD COLUMN IF NOT EXISTS last_checkpoint TIMESTAMPTZ;

-- Extend users table with security-specific fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS guard_license_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS guard_license_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS guard_license_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_check_status TEXT CHECK (background_check_status IN ('pending', 'passed', 'failed'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_check_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('Entry', 'Intermediate', 'Expert'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS establishment_type TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_job_id ON incidents(job_id);
CREATE INDEX IF NOT EXISTS idx_incidents_guard_id ON incidents(guard_id);
CREATE INDEX IF NOT EXISTS idx_incidents_timestamp ON incidents(timestamp);
CREATE INDEX IF NOT EXISTS idx_guard_tracking_guard_id ON guard_tracking(guard_id);
CREATE INDEX IF NOT EXISTS idx_guard_tracking_timestamp ON guard_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_shift_checkpoints_job_id ON shift_checkpoints(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_guard_id ON emergency_alerts(guard_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_alerts_updated_at BEFORE UPDATE ON emergency_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_records_updated_at BEFORE UPDATE ON training_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_tracking_updated_at BEFORE UPDATE ON compliance_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for incidents (guards can create/read their own, clients can read their jobs' incidents)
CREATE POLICY "Guards can create incidents for their jobs" ON incidents
    FOR INSERT WITH CHECK (guard_id = auth.uid());

CREATE POLICY "Guards can view their own incidents" ON incidents
    FOR SELECT USING (guard_id = auth.uid());

CREATE POLICY "Clients can view incidents for their jobs" ON incidents
    FOR SELECT USING (client_id = auth.uid());

-- Policies for guard tracking (guards can create/read their own)
CREATE POLICY "Guards can create their own tracking data" ON guard_tracking
    FOR INSERT WITH CHECK (guard_id = auth.uid());

CREATE POLICY "Guards can view their own tracking data" ON guard_tracking
    FOR SELECT USING (guard_id = auth.uid());

-- Policies for messages (users can send/receive their own messages)
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Policies for emergency alerts (guards can create their own, clients can view their jobs' alerts)
CREATE POLICY "Guards can create emergency alerts" ON emergency_alerts
    FOR INSERT WITH CHECK (guard_id = auth.uid());

CREATE POLICY "Guards can view their own alerts" ON emergency_alerts
    FOR SELECT USING (guard_id = auth.uid());

-- Add a function to calculate distance between two coordinates
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    distance DECIMAL;
BEGIN
    -- Using the Haversine formula to calculate distance in meters
    SELECT (
        6371000 * acos(
            cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
            sin(radians(lat1)) * sin(radians(lat2))
        )
    ) INTO distance;
    
    RETURN distance;
END;
$$ LANGUAGE plpgsql; 