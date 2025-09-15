-- Add Critical Database Constraints - Priority 2
-- This migration adds essential data validation and constraints

-- =============================================
-- 1. JOBS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for jobs table
ALTER TABLE jobs ADD CONSTRAINT chk_jobs_status 
    CHECK (status IN ('pending', 'paid', 'active', 'completed', 'cancelled'));

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_payment_status 
    CHECK (payment_status IN ('pending', 'paid', 'completed', 'refunded', 'disputed') OR payment_status IS NULL);

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_priority_level 
    CHECK (priority_level IN ('low', 'medium', 'high', 'urgent') OR priority_level IS NULL);

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_recurring_mode 
    CHECK (recurring_mode IN ('none', 'weekly', 'monthly'));

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_recurring_pattern_type 
    CHECK (recurring_pattern_type IN ('weekly', 'monthly') OR recurring_pattern_type IS NULL);

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_hourly_pay_positive 
    CHECK (hourly_pay > 0);

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_total_amount_positive 
    CHECK (total_amount > 0);

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_duration_positive 
    CHECK (duration > 0);

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_num_guards_positive 
    CHECK (num_guards > 0);

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_event_dates_not_empty 
    CHECK (array_length(event_dates, 1) > 0);

-- Add email validation for manager_phone
ALTER TABLE jobs ADD CONSTRAINT chk_jobs_manager_phone_format 
    CHECK (manager_phone ~ '^\+?[1-9]\d{1,14}$');

-- =============================================
-- 2. USERS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for users table
ALTER TABLE users ADD CONSTRAINT chk_users_role 
    CHECK (role IN ('client', 'guard', 'admin'));

ALTER TABLE users ADD CONSTRAINT chk_users_status 
    CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification'));

ALTER TABLE users ADD CONSTRAINT chk_users_email_format 
    CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT chk_users_phone_format 
    CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$');

-- =============================================
-- 3. JOB_GUARDS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for job_guards table
ALTER TABLE job_guards ADD CONSTRAINT chk_job_guards_status 
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'));

-- =============================================
-- 4. PAYMENTS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for payments table
ALTER TABLE payments ADD CONSTRAINT chk_payments_status 
    CHECK (status IN ('pending', 'processing', 'confirmed', 'failed', 'cancelled', 'refunded'));

ALTER TABLE payments ADD CONSTRAINT chk_payments_amount_positive 
    CHECK (amount > 0);

ALTER TABLE payments ADD CONSTRAINT chk_payments_currency_format 
    CHECK (currency ~ '^[A-Z]{3}$');

-- =============================================
-- 5. ESCROW TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for escrow table
ALTER TABLE escrow ADD CONSTRAINT chk_escrow_status 
    CHECK (status IN ('pending', 'released', 'disputed', 'refunded'));

ALTER TABLE escrow ADD CONSTRAINT chk_escrow_amount_positive 
    CHECK (amount > 0);

ALTER TABLE escrow ADD CONSTRAINT chk_escrow_platform_fee_non_negative 
    CHECK (platform_fee >= 0);

ALTER TABLE escrow ADD CONSTRAINT chk_escrow_stripe_fee_non_negative 
    CHECK (stripe_fee >= 0);

ALTER TABLE escrow ADD CONSTRAINT chk_escrow_net_amount_positive 
    CHECK (net_amount > 0);

-- =============================================
-- 6. GUARD_RATINGS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for guard_ratings table
ALTER TABLE guard_ratings ADD CONSTRAINT chk_guard_ratings_rating_range 
    CHECK (rating >= 1 AND rating <= 5);

-- =============================================
-- 7. PAYMENT_DISPUTES TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for payment_disputes table
ALTER TABLE payment_disputes ADD CONSTRAINT chk_payment_disputes_status 
    CHECK (status IN ('open', 'under_review', 'resolved', 'closed'));

ALTER TABLE payment_disputes ADD CONSTRAINT chk_payment_disputes_reason 
    CHECK (reason IN ('fraud', 'unauthorized', 'product_not_received', 'product_unacceptable', 'duplicate', 'subscription_cancelled', 'other'));

-- =============================================
-- 8. GUARD_PAYOUTS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for guard_payouts table
ALTER TABLE guard_payouts ADD CONSTRAINT chk_guard_payouts_status 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

ALTER TABLE guard_payouts ADD CONSTRAINT chk_guard_payouts_amount_positive 
    CHECK (amount > 0);

-- =============================================
-- 9. NOTIFICATIONS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for notifications table
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_type 
    CHECK (type IN ('job_posted', 'job_accepted', 'job_rejected', 'job_started', 'job_completed', 'incident_reported', 'payment_received', 'message_received', 'emergency_alert', 'check_in_reminder', 'check_out_reminder'));

ALTER TABLE notifications ADD CONSTRAINT chk_notifications_priority 
    CHECK (priority IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE notifications ADD CONSTRAINT chk_notifications_read_boolean 
    CHECK (read IN (true, false));

-- =============================================
-- 10. ANALYTICS_EVENTS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for analytics_events table
ALTER TABLE analytics_events ADD CONSTRAINT chk_analytics_events_event_type_not_empty 
    CHECK (event_type IS NOT NULL AND event_type != '');

-- =============================================
-- 11. SECURITY_LOGS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for security_logs table
ALTER TABLE security_logs ADD CONSTRAINT chk_security_logs_event_type_not_empty 
    CHECK (event_type IS NOT NULL AND event_type != '');

-- =============================================
-- 12. LOCATION_HISTORY TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for location_history table
ALTER TABLE location_history ADD CONSTRAINT chk_location_history_latitude_range 
    CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE location_history ADD CONSTRAINT chk_location_history_longitude_range 
    CHECK (longitude >= -180 AND longitude <= 180);

ALTER TABLE location_history ADD CONSTRAINT chk_location_history_accuracy_positive 
    CHECK (accuracy > 0);

-- =============================================
-- 13. SESSION_DATA TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for session_data table
ALTER TABLE session_data ADD CONSTRAINT chk_session_data_expires_at_future 
    CHECK (expires_at > created_at);

-- =============================================
-- 14. NOTIFICATION_LOGS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for notification_logs table
ALTER TABLE notification_logs ADD CONSTRAINT chk_notification_logs_notification_type_not_empty 
    CHECK (notification_type IS NOT NULL AND notification_type != '');

ALTER TABLE notification_logs ADD CONSTRAINT chk_notification_logs_status 
    CHECK (status IN ('sent', 'delivered', 'failed', 'bounced'));

-- =============================================
-- 15. FEATURE_FLAGS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for feature_flags table
ALTER TABLE feature_flags ADD CONSTRAINT chk_feature_flags_enabled_boolean 
    CHECK (enabled IN (true, false));

-- =============================================
-- 16. EXPERIMENTS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for experiments table
ALTER TABLE experiments ADD CONSTRAINT chk_experiments_status 
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled'));

ALTER TABLE experiments ADD CONSTRAINT chk_experiments_traffic_allocation_range 
    CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100);

-- =============================================
-- 17. EXPERIMENT_ASSIGNMENTS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for experiment_assignments table
ALTER TABLE experiment_assignments ADD CONSTRAINT chk_experiment_assignments_variant_not_empty 
    CHECK (variant IS NOT NULL AND variant != '');

-- =============================================
-- 18. PRIVACY_REQUESTS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for privacy_requests table
ALTER TABLE privacy_requests ADD CONSTRAINT chk_privacy_requests_request_type 
    CHECK (request_type IN ('data_access', 'data_portability', 'data_rectification', 'data_erasure', 'processing_restriction', 'objection_to_processing'));

ALTER TABLE privacy_requests ADD CONSTRAINT chk_privacy_requests_status 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected'));

-- =============================================
-- 19. DATA_EXPORTS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for data_exports table
ALTER TABLE data_exports ADD CONSTRAINT chk_data_exports_status 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- =============================================
-- 20. PROCESSING_RESTRICTIONS TABLE CONSTRAINTS
-- =============================================

-- Add check constraints for processing_restrictions table
ALTER TABLE processing_restrictions ADD CONSTRAINT chk_processing_restrictions_restriction_type 
    CHECK (restriction_type IN ('marketing', 'analytics', 'profiling', 'automated_decision_making'));

ALTER TABLE processing_restrictions ADD CONSTRAINT chk_processing_restrictions_status 
    CHECK (status IN ('active', 'inactive'));

-- =============================================
-- 21. UNIQUE CONSTRAINTS
-- =============================================

-- Add unique constraints to prevent duplicates
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT uk_users_phone UNIQUE (phone) WHERE phone IS NOT NULL;

-- =============================================
-- 22. FOREIGN KEY CONSTRAINTS
-- =============================================

-- Add foreign key constraints for data integrity
ALTER TABLE jobs ADD CONSTRAINT fk_jobs_client_id 
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE job_guards ADD CONSTRAINT fk_job_guards_job_id 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE job_guards ADD CONSTRAINT fk_job_guards_guard_id 
    FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT fk_payments_job_id 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT fk_payments_client_id 
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT fk_payments_guard_id 
    FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE escrow ADD CONSTRAINT fk_escrow_job_id 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE escrow ADD CONSTRAINT fk_escrow_client_id 
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE escrow ADD CONSTRAINT fk_escrow_guard_id 
    FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE guard_ratings ADD CONSTRAINT fk_guard_ratings_job_id 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE guard_ratings ADD CONSTRAINT fk_guard_ratings_guard_id 
    FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE guard_ratings ADD CONSTRAINT fk_guard_ratings_client_id 
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payment_disputes ADD CONSTRAINT fk_payment_disputes_payment_id 
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE;

ALTER TABLE guard_payouts ADD CONSTRAINT fk_guard_payouts_guard_id 
    FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payment_methods ADD CONSTRAINT fk_payment_methods_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE emergency_contacts ADD CONSTRAINT fk_emergency_contacts_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE analytics_events ADD CONSTRAINT fk_analytics_events_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE security_logs ADD CONSTRAINT fk_security_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE location_history ADD CONSTRAINT fk_location_history_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE location_history ADD CONSTRAINT fk_location_history_job_id 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE session_data ADD CONSTRAINT fk_session_data_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notification_logs ADD CONSTRAINT fk_notification_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =============================================
-- 23. COMMENTS ON CONSTRAINTS
-- =============================================

COMMENT ON CONSTRAINT chk_jobs_status ON jobs IS 'Ensures job status is valid';
COMMENT ON CONSTRAINT chk_jobs_payment_status ON jobs IS 'Ensures payment status is valid';
COMMENT ON CONSTRAINT chk_jobs_hourly_pay_positive ON jobs IS 'Ensures hourly pay is positive';
COMMENT ON CONSTRAINT chk_jobs_total_amount_positive ON jobs IS 'Ensures total amount is positive';
COMMENT ON CONSTRAINT chk_users_role ON users IS 'Ensures user role is valid';
COMMENT ON CONSTRAINT chk_users_status ON users IS 'Ensures user status is valid';
COMMENT ON CONSTRAINT chk_users_email_format ON users IS 'Ensures email format is valid';
COMMENT ON CONSTRAINT chk_payments_status ON payments IS 'Ensures payment status is valid';
COMMENT ON CONSTRAINT chk_payments_amount_positive ON payments IS 'Ensures payment amount is positive';
COMMENT ON CONSTRAINT chk_guard_ratings_rating_range ON guard_ratings IS 'Ensures rating is between 1 and 5';
COMMENT ON CONSTRAINT uk_users_email ON users IS 'Ensures email uniqueness';
COMMENT ON CONSTRAINT fk_jobs_client_id ON jobs IS 'Ensures job client exists';
COMMENT ON CONSTRAINT fk_job_guards_job_id ON job_guards IS 'Ensures job guard assignment references valid job';
COMMENT ON CONSTRAINT fk_job_guards_guard_id ON job_guards IS 'Ensures job guard assignment references valid guard';
