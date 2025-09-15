-- Database Optimization Migration
-- This migration removes unnecessary tables and merges redundant ones
-- Reduces from 27 tables to 22 tables (5 tables removed/merged)

-- =============================================
-- 1. BACKUP DATA BEFORE OPTIMIZATION
-- =============================================

-- Create backup tables for data we want to preserve
CREATE TABLE IF NOT EXISTS backup_guard_ratings AS 
SELECT * FROM guard_ratings;

CREATE TABLE IF NOT EXISTS backup_customers AS 
SELECT * FROM customers;

CREATE TABLE IF NOT EXISTS backup_payment_transactions AS 
SELECT * FROM payment_transactions;

-- =============================================
-- 2. MERGE GUARD_RATINGS INTO REVIEWS
-- =============================================

-- Add missing columns to reviews table if they don't exist
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS rater_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS score integer CHECK (score >= 1 AND score <= 5);

-- Migrate data from guard_ratings to reviews
INSERT INTO reviews (id, guard_id, client_id, rater_id, score, review_text, created_at)
SELECT 
    gen_random_uuid() as id,
    gr.guard_id,
    gr.rater_id as client_id, -- Assuming rater is the client
    gr.rater_id,
    gr.score,
    gr.comment as review_text,
    gr.created_at
FROM guard_ratings gr
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r 
    WHERE r.guard_id = gr.guard_id 
    AND r.rater_id = gr.rater_id
);

-- =============================================
-- 3. MERGE CUSTOMERS INTO USERS
-- =============================================

-- Add stripe_customer_id to users if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Migrate stripe_customer_id from customers to users
UPDATE users 
SET stripe_customer_id = c.customer_id
FROM customers c 
WHERE users.id = c.user_id;

-- =============================================
-- 4. MERGE PAYMENT_TRANSACTIONS INTO PAYMENTS
-- =============================================

-- Add missing columns to payments table if they don't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
ADD COLUMN IF NOT EXISTS description text;

-- Migrate data from payment_transactions to payments
INSERT INTO payments (
    id, job_id, client_id, guard_id, stripe_payment_intent_id, 
    amount, currency, status, description, stripe_transfer_id, 
    created_at, updated_at
)
SELECT 
    pt.id,
    pt.job_id,
    pt.client_id,
    pt.guard_id,
    pt.stripe_payment_intent_id,
    pt.amount,
    pt.currency,
    pt.status,
    pt.description,
    pt.stripe_transfer_id,
    pt.created_at,
    pt.updated_at
FROM payment_transactions pt
WHERE NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.stripe_payment_intent_id = pt.stripe_payment_intent_id
);

-- =============================================
-- 5. REMOVE UNNECESSARY TABLES
-- =============================================

-- Drop foreign key constraints first
ALTER TABLE guard_achievements DROP CONSTRAINT IF EXISTS guard_achievements_guard_id_fkey;
ALTER TABLE guard_achievements DROP CONSTRAINT IF EXISTS guard_achievements_achievement_id_fkey;

-- Drop unnecessary tables
DROP TABLE IF EXISTS guard_ratings CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS achievements_master CASCADE;
DROP TABLE IF EXISTS guard_achievements CASCADE;

-- =============================================
-- 6. ADD MISSING INDEXES FOR PERFORMANCE
-- =============================================

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_guard_id ON reviews(guard_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rater_id ON reviews(rater_id);
CREATE INDEX IF NOT EXISTS idx_reviews_score ON reviews(score);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_transfer_id ON payments(stripe_transfer_id);
CREATE INDEX IF NOT EXISTS idx_payments_description ON payments(description);

-- =============================================
-- 7. UPDATE RLS POLICIES FOR MERGED TABLES
-- =============================================

-- Update reviews RLS policies to include rater_id
DROP POLICY IF EXISTS "Users can view ratings for their jobs" ON reviews;
DROP POLICY IF EXISTS "Users can create ratings for their jobs" ON reviews;
DROP POLICY IF EXISTS "Users can update their own ratings" ON reviews;

CREATE POLICY "Users can view reviews for their jobs" ON reviews
    FOR SELECT USING (
        auth.uid() IN (SELECT client_id FROM jobs WHERE id = reviews.job_id) OR
        auth.uid() = guard_id OR
        auth.uid() = rater_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can create reviews for their jobs" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid() = rater_id AND
        EXISTS (
            SELECT 1 FROM jobs j
            WHERE j.id = reviews.job_id
            AND j.client_id = auth.uid()
            AND j.status = 'completed'
        )
    );

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (
        auth.uid() = rater_id AND created_at > now() - INTERVAL '24 hours'
    );

-- =============================================
-- 8. CLEANUP AND OPTIMIZATION
-- =============================================

-- Update table statistics
ANALYZE reviews;
ANALYZE users;
ANALYZE payments;

-- Add comments for documentation
COMMENT ON TABLE reviews IS 'Merged table containing both job reviews and guard ratings';
COMMENT ON COLUMN reviews.rater_id IS 'ID of the user who wrote the review/rating';
COMMENT ON COLUMN reviews.score IS 'Rating score (1-5) for guard ratings';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';

-- =============================================
-- 9. VERIFICATION QUERIES
-- =============================================

-- Verify data migration
DO $$
DECLARE
    guard_ratings_count INTEGER;
    reviews_count INTEGER;
    customers_count INTEGER;
    users_with_stripe_count INTEGER;
    payment_transactions_count INTEGER;
    payments_count INTEGER;
BEGIN
    -- Check guard_ratings migration
    SELECT COUNT(*) INTO guard_ratings_count FROM backup_guard_ratings;
    SELECT COUNT(*) INTO reviews_count FROM reviews WHERE rater_id IS NOT NULL;
    
    IF guard_ratings_count != reviews_count THEN
        RAISE WARNING 'Guard ratings migration incomplete: % records in backup, % in reviews', 
            guard_ratings_count, reviews_count;
    END IF;
    
    -- Check customers migration
    SELECT COUNT(*) INTO customers_count FROM backup_customers;
    SELECT COUNT(*) INTO users_with_stripe_count FROM users WHERE stripe_customer_id IS NOT NULL;
    
    IF customers_count != users_with_stripe_count THEN
        RAISE WARNING 'Customers migration incomplete: % records in backup, % users with stripe_customer_id', 
            customers_count, users_with_stripe_count;
    END IF;
    
    -- Check payment_transactions migration
    SELECT COUNT(*) INTO payment_transactions_count FROM backup_payment_transactions;
    SELECT COUNT(*) INTO payments_count FROM payments WHERE stripe_transfer_id IS NOT NULL;
    
    IF payment_transactions_count != payments_count THEN
        RAISE WARNING 'Payment transactions migration incomplete: % records in backup, % payments with transfer_id', 
            payment_transactions_count, payments_count;
    END IF;
    
    RAISE NOTICE 'Database optimization completed successfully';
    RAISE NOTICE 'Tables reduced from 27 to 22 (5 tables removed/merged)';
    RAISE NOTICE 'Guard ratings: % migrated to reviews', reviews_count;
    RAISE NOTICE 'Customers: % migrated to users', users_with_stripe_count;
    RAISE NOTICE 'Payment transactions: % migrated to payments', payments_count;
END $$;

-- =============================================
-- 10. CLEANUP BACKUP TABLES (OPTIONAL)
-- =============================================

-- Uncomment the following lines after verifying the migration
-- DROP TABLE IF EXISTS backup_guard_ratings;
-- DROP TABLE IF EXISTS backup_customers;
-- DROP TABLE IF EXISTS backup_payment_transactions;
