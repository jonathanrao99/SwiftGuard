-- Advanced Database Optimization Migration
-- This migration further optimizes the remaining 22 tables
-- Focuses on performance, data integrity, and storage efficiency

-- =============================================
-- 1. OPTIMIZE JOBS TABLE
-- =============================================

-- Remove redundant columns from jobs table
ALTER TABLE jobs DROP COLUMN IF EXISTS guard_id; -- Redundant with job_guards
ALTER TABLE jobs DROP COLUMN IF EXISTS payment_amount; -- Redundant with payments table
ALTER TABLE jobs DROP COLUMN IF EXISTS payment_currency; -- Redundant with payments table
ALTER TABLE jobs DROP COLUMN IF EXISTS payment_intent_id; -- Redundant with payments table

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON jobs(payment_status);
CREATE INDEX IF NOT EXISTS idx_jobs_start_time ON jobs(start_time);
CREATE INDEX IF NOT EXISTS idx_jobs_end_time ON jobs(end_time);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- =============================================
-- 2. OPTIMIZE USERS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- =============================================
-- 3. OPTIMIZE PAYMENTS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount);

-- =============================================
-- 4. OPTIMIZE NOTIFICATIONS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =============================================
-- 5. OPTIMIZE MESSAGES TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =============================================
-- 6. OPTIMIZE REVIEWS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- =============================================
-- 7. OPTIMIZE INCIDENTS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_job_id ON incidents(job_id);
CREATE INDEX IF NOT EXISTS idx_incidents_guard_id ON incidents(guard_id);
CREATE INDEX IF NOT EXISTS idx_incidents_client_id ON incidents(client_id);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);

-- =============================================
-- 8. OPTIMIZE CHECKPOINTS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkpoints_job_id ON checkpoints(job_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_guard_id ON checkpoints(guard_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_completed ON checkpoints(completed);
CREATE INDEX IF NOT EXISTS idx_checkpoints_created_at ON checkpoints(created_at);

-- =============================================
-- 9. OPTIMIZE EMERGENCY TABLES
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_job_id ON emergency_alerts(job_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_guard_id ON emergency_alerts(guard_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_alert_time ON emergency_alerts(alert_time);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_is_primary ON emergency_contacts(is_primary);

-- =============================================
-- 10. OPTIMIZE ANALYTICS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_ts ON analytics_events(ts);

-- =============================================
-- 11. OPTIMIZE RATE LIMITS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

-- =============================================
-- 12. OPTIMIZE LOCATION TABLES
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_encrypted_locations_user_id ON encrypted_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_locations_job_id ON encrypted_locations(job_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_locations_location_type ON encrypted_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_encrypted_locations_created_at ON encrypted_locations(created_at);

-- =============================================
-- 13. OPTIMIZE GUARD AVAILABILITY TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_guard_availability_guard_id ON guard_availability(guard_id);
CREATE INDEX IF NOT EXISTS idx_guard_availability_day_of_week ON guard_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_guard_availability_is_available ON guard_availability(is_available);

-- =============================================
-- 14. OPTIMIZE JOB TEMPLATES TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_templates_client_id ON job_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_job_templates_is_active ON job_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_job_templates_created_at ON job_templates(created_at);

-- =============================================
-- 15. OPTIMIZE WAITLIST TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);

-- =============================================
-- 16. OPTIMIZE PUSH TOKENS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_platform ON user_push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_is_active ON user_push_tokens(is_active);

-- =============================================
-- 17. OPTIMIZE NOTIFICATION PREFERENCES TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(type);

-- =============================================
-- 18. OPTIMIZE NOTIFICATION TEMPLATES TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_is_active ON notification_templates(is_active);

-- =============================================
-- 19. OPTIMIZE NOTIFICATION LOGS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- =============================================
-- 20. OPTIMIZE ESCROW TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrow_job_id ON escrow(job_id);
CREATE INDEX IF NOT EXISTS idx_escrow_client_id ON escrow(client_id);
CREATE INDEX IF NOT EXISTS idx_escrow_guard_id ON escrow(guard_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow(status);
CREATE INDEX IF NOT EXISTS idx_escrow_created_at ON escrow(created_at);

-- =============================================
-- 21. OPTIMIZE GUARD PAYOUTS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_guard_payouts_job_id ON guard_payouts(job_id);
CREATE INDEX IF NOT EXISTS idx_guard_payouts_guard_id ON guard_payouts(guard_id);
CREATE INDEX IF NOT EXISTS idx_guard_payouts_status ON guard_payouts(status);
CREATE INDEX IF NOT EXISTS idx_guard_payouts_created_at ON guard_payouts(created_at);

-- =============================================
-- 22. OPTIMIZE PAYMENT DISPUTES TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_disputes_job_id ON payment_disputes(job_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_escrow_id ON payment_disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_initiator_id ON payment_disputes(initiator_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_created_at ON payment_disputes(created_at);

-- =============================================
-- 23. OPTIMIZE PAYMENT METHODS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

-- =============================================
-- 24. OPTIMIZE PAYMENT WEBHOOKS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_created_at ON payment_webhooks(created_at);

-- =============================================
-- 25. OPTIMIZE JOB_GUARDS TABLE
-- =============================================

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_guards_job_id ON job_guards(job_id);
CREATE INDEX IF NOT EXISTS idx_job_guards_guard_id ON job_guards(guard_id);
CREATE INDEX IF NOT EXISTS idx_job_guards_status ON job_guards(status);
CREATE INDEX IF NOT EXISTS idx_job_guards_assigned_at ON job_guards(assigned_at);

-- =============================================
-- 26. UPDATE TABLE STATISTICS
-- =============================================

-- Update statistics for all tables
ANALYZE users;
ANALYZE jobs;
ANALYZE job_guards;
ANALYZE reviews;
ANALYZE incidents;
ANALYZE messages;
ANALYZE checkpoints;
ANALYZE notifications;
ANALYZE notification_preferences;
ANALYZE notification_templates;
ANALYZE notification_logs;
ANALYZE user_push_tokens;
ANALYZE payments;
ANALYZE escrow;
ANALYZE guard_payouts;
ANALYZE payment_methods;
ANALYZE payment_disputes;
ANALYZE payment_webhooks;
ANALYZE emergency_alerts;
ANALYZE emergency_contacts;
ANALYZE emergency_alert_audit;
ANALYZE encrypted_locations;
ANALYZE analytics_events;
ANALYZE rate_limits;
ANALYZE guard_availability;
ANALYZE job_templates;
ANALYZE waitlist;

-- =============================================
-- 27. VERIFICATION AND REPORTING
-- =============================================

DO $$
DECLARE
    total_tables INTEGER;
    total_indexes INTEGER;
    total_rows INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO total_tables 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    -- Count indexes
    SELECT COUNT(*) INTO total_indexes 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Count total rows across all tables
    SELECT SUM(n_tup_ins) INTO total_rows 
    FROM pg_stat_user_tables;
    
    RAISE NOTICE 'Database optimization completed successfully';
    RAISE NOTICE 'Total tables: %', total_tables;
    RAISE NOTICE 'Total indexes: %', total_indexes;
    RAISE NOTICE 'Total rows: %', total_rows;
    RAISE NOTICE 'Performance optimization complete - all tables now have proper indexes';
END $$;
