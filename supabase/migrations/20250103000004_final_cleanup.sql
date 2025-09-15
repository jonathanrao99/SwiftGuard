-- Final Database Cleanup Migration
-- This migration performs final cleanup and optimization
-- Ensures data integrity and removes any remaining issues

-- =============================================
-- 1. CLEANUP ORPHANED DATA
-- =============================================

-- Remove orphaned job_guards records
DELETE FROM job_guards 
WHERE job_id NOT IN (SELECT id FROM jobs);

-- Remove orphaned reviews records
DELETE FROM reviews 
WHERE job_id NOT IN (SELECT id FROM jobs);

-- Remove orphaned incidents records
DELETE FROM incidents 
WHERE job_id NOT IN (SELECT id FROM jobs);

-- Remove orphaned messages records
DELETE FROM messages 
WHERE job_id NOT IN (SELECT id FROM jobs);

-- Remove orphaned checkpoints records
DELETE FROM checkpoints 
WHERE job_id NOT IN (SELECT id FROM jobs);

-- Remove orphaned emergency_alerts records
DELETE FROM emergency_alerts 
WHERE job_id NOT IN (SELECT id FROM jobs);

-- Remove orphaned payments records
DELETE FROM payments 
WHERE job_id NOT IN (SELECT id FROM jobs);

-- Remove orphaned escrow records
DELETE FROM escrow 
WHERE job_id NOT IN (SELECT id FROM jobs);

-- Remove orphaned guard_payouts records
DELETE FROM guard_payouts 
WHERE job_id NOT IN (SELECT id FROM jobs);

-- Remove orphaned payment_disputes records
DELETE FROM payment_disputes 
WHERE job_id NOT IN (SELECT id FROM jobs);

-- =============================================
-- 2. CLEANUP USER REFERENCES
-- =============================================

-- Remove orphaned records referencing non-existent users
DELETE FROM job_guards 
WHERE guard_id NOT IN (SELECT id FROM users);

DELETE FROM reviews 
WHERE guard_id NOT IN (SELECT id FROM users) 
OR client_id NOT IN (SELECT id FROM users);

DELETE FROM incidents 
WHERE guard_id NOT IN (SELECT id FROM users) 
OR client_id NOT IN (SELECT id FROM users);

DELETE FROM messages 
WHERE sender_id NOT IN (SELECT id FROM users) 
OR receiver_id NOT IN (SELECT id FROM users);

DELETE FROM checkpoints 
WHERE guard_id NOT IN (SELECT id FROM users);

DELETE FROM emergency_alerts 
WHERE guard_id NOT IN (SELECT id FROM users) 
OR client_id NOT IN (SELECT id FROM users);

DELETE FROM payments 
WHERE client_id NOT IN (SELECT id FROM users) 
OR guard_id NOT IN (SELECT id FROM users);

DELETE FROM escrow 
WHERE client_id NOT IN (SELECT id FROM users) 
OR guard_id NOT IN (SELECT id FROM users);

DELETE FROM guard_payouts 
WHERE guard_id NOT IN (SELECT id FROM users);

DELETE FROM payment_disputes 
WHERE initiator_id NOT IN (SELECT id FROM users) 
OR resolved_by NOT IN (SELECT id FROM users);

-- =============================================
-- 3. OPTIMIZE STORAGE
-- =============================================

-- Vacuum and analyze all tables for optimal storage
VACUUM ANALYZE users;
VACUUM ANALYZE jobs;
VACUUM ANALYZE job_guards;
VACUUM ANALYZE reviews;
VACUUM ANALYZE incidents;
VACUUM ANALYZE messages;
VACUUM ANALYZE checkpoints;
VACUUM ANALYZE notifications;
VACUUM ANALYZE notification_preferences;
VACUUM ANALYZE notification_templates;
VACUUM ANALYZE notification_logs;
VACUUM ANALYZE user_push_tokens;
VACUUM ANALYZE payments;
VACUUM ANALYZE escrow;
VACUUM ANALYZE guard_payouts;
VACUUM ANALYZE payment_methods;
VACUUM ANALYZE payment_disputes;
VACUUM ANALYZE payment_webhooks;
VACUUM ANALYZE emergency_alerts;
VACUUM ANALYZE emergency_contacts;
VACUUM ANALYZE emergency_alert_audit;
VACUUM ANALYZE encrypted_locations;
VACUUM ANALYZE analytics_events;
VACUUM ANALYZE rate_limits;
VACUUM ANALYZE guard_availability;
VACUUM ANALYZE job_templates;
VACUUM ANALYZE waitlist;

-- =============================================
-- 4. ADD COMPOSITE INDEXES FOR COMMON QUERIES
-- =============================================

-- Common query patterns optimization
CREATE INDEX IF NOT EXISTS idx_jobs_client_status ON jobs(client_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_guard_created ON reviews(guard_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_job_created ON messages(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_payments_client_status ON payments(client_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_job_severity ON incidents(job_id, severity);

-- =============================================
-- 5. ADD PARTIAL INDEXES FOR PERFORMANCE
-- =============================================

-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(id) WHERE status IN ('open', 'assigned', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(id) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_payments_pending ON payments(id) WHERE status = 'pending';

-- =============================================
-- 6. ADD COVERING INDEXES FOR COMMON QUERIES
-- =============================================

-- Covering indexes to avoid table lookups
CREATE INDEX IF NOT EXISTS idx_jobs_listing ON jobs(id, title, location, pay, start_time, end_time, status, created_at);
CREATE INDEX IF NOT EXISTS idx_users_profile ON users(id, first_name, last_name, email, role, status);
CREATE INDEX IF NOT EXISTS idx_reviews_summary ON reviews(guard_id, score, created_at) INCLUDE (review_text);

-- =============================================
-- 7. ADD FULL-TEXT SEARCH INDEXES
-- =============================================

-- Full-text search for job descriptions
CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING gin(to_tsvector('english', title || ' ' || description));

-- Full-text search for user bios
CREATE INDEX IF NOT EXISTS idx_users_bio_search ON users USING gin(to_tsvector('english', bio));

-- Full-text search for review text
CREATE INDEX IF NOT EXISTS idx_reviews_search ON reviews USING gin(to_tsvector('english', review_text));

-- =============================================
-- 8. ADD JSONB INDEXES FOR METADATA
-- =============================================

-- JSONB indexes for metadata fields
CREATE INDEX IF NOT EXISTS idx_jobs_requirements ON jobs USING gin(requirements);
CREATE INDEX IF NOT EXISTS idx_users_certifications ON users USING gin(certifications);
CREATE INDEX IF NOT EXISTS idx_payments_metadata ON payments USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_notifications_data ON notifications USING gin(data);

-- =============================================
-- 9. ADD SPATIAL INDEXES FOR LOCATION DATA
-- =============================================

-- Spatial indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_checkpoints_location ON checkpoints USING gist(ll_to_earth(latitude, longitude));
CREATE INDEX IF NOT EXISTS idx_encrypted_locations_precision ON encrypted_locations(precision_reduced_lat, precision_reduced_lng);

-- =============================================
-- 10. FINAL VERIFICATION
-- =============================================

DO $$
DECLARE
    total_tables INTEGER;
    total_indexes INTEGER;
    total_rows INTEGER;
    orphaned_records INTEGER;
    storage_size TEXT;
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
    
    -- Count total rows
    SELECT SUM(n_tup_ins) INTO total_rows 
    FROM pg_stat_user_tables;
    
    -- Check for orphaned records
    SELECT COUNT(*) INTO orphaned_records
    FROM (
        SELECT 1 FROM job_guards WHERE job_id NOT IN (SELECT id FROM jobs)
        UNION ALL
        SELECT 1 FROM reviews WHERE job_id NOT IN (SELECT id FROM jobs)
        UNION ALL
        SELECT 1 FROM incidents WHERE job_id NOT IN (SELECT id FROM jobs)
        UNION ALL
        SELECT 1 FROM messages WHERE job_id NOT IN (SELECT id FROM jobs)
        UNION ALL
        SELECT 1 FROM checkpoints WHERE job_id NOT IN (SELECT id FROM jobs)
        UNION ALL
        SELECT 1 FROM emergency_alerts WHERE job_id NOT IN (SELECT id FROM jobs)
        UNION ALL
        SELECT 1 FROM payments WHERE job_id NOT IN (SELECT id FROM jobs)
        UNION ALL
        SELECT 1 FROM escrow WHERE job_id NOT IN (SELECT id FROM jobs)
        UNION ALL
        SELECT 1 FROM guard_payouts WHERE job_id NOT IN (SELECT id FROM jobs)
        UNION ALL
        SELECT 1 FROM payment_disputes WHERE job_id NOT IN (SELECT id FROM jobs)
    ) AS orphaned;
    
    -- Get database size
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO storage_size;
    
    RAISE NOTICE 'Final database cleanup completed successfully';
    RAISE NOTICE 'Total tables: %', total_tables;
    RAISE NOTICE 'Total indexes: %', total_indexes;
    RAISE NOTICE 'Total rows: %', total_rows;
    RAISE NOTICE 'Orphaned records: %', orphaned_records;
    RAISE NOTICE 'Database size: %', storage_size;
    
    IF orphaned_records > 0 THEN
        RAISE WARNING 'Found % orphaned records that could not be cleaned up', orphaned_records;
    END IF;
    
    RAISE NOTICE 'Database optimization complete - ready for production use';
END $$;
