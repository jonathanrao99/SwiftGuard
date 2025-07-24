
CREATE TABLE achievements_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    criteria_type TEXT NOT NULL, -- e.g., 'jobs_completed', 'average_rating', 'incidents_reported'
    criteria_value NUMERIC NOT NULL, -- e.g., 10 (jobs), 4.5 (rating), 5 (incidents)
    badge_icon_url TEXT -- URL to an icon representing the badge
);

CREATE TABLE guard_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guard_id UUID NOT NULL REFERENCES auth.users(id),
    achievement_id UUID NOT NULL REFERENCES achievements_master(id),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (guard_id, achievement_id)
);

ALTER TABLE achievements_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements_master (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view achievements master" 
ON achievements_master
FOR SELECT
TO authenticated
USING (true);

-- Policies for guard_achievements
CREATE POLICY "Guards can view their own achievements" 
ON guard_achievements
FOR SELECT
TO authenticated
USING (guard_id = auth.uid());

CREATE POLICY "Admins can insert guard achievements" 
ON guard_achievements
FOR INSERT
TO service_role -- Or a specific admin role if you have one
WITH CHECK (true);
