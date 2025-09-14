-- Create payment system tables
-- This migration creates the complete payment infrastructure for SwiftGuard

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guard_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed', 'canceled', 'refunded')),
    payment_method_id TEXT,
    client_secret TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT
);

-- Create escrow table
CREATE TABLE IF NOT EXISTS escrow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    payment_intent_id TEXT NOT NULL REFERENCES payments(stripe_payment_intent_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guard_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    stripe_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL CHECK (net_amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE,
    dispute_reason TEXT,
    dispute_evidence TEXT,
    disputed_at TIMESTAMP WITH TIME ZONE
);

-- Create payment disputes table
CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    escrow_id UUID NOT NULL REFERENCES escrow(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    evidence TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
    resolution TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create guard payouts table
CREATE TABLE IF NOT EXISTS guard_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    guard_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    escrow_id UUID NOT NULL REFERENCES escrow(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    stripe_transfer_id TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled')),
    processing_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL CHECK (net_amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'bank_account')),
    card_brand VARCHAR(20),
    card_last4 VARCHAR(4),
    card_exp_month INTEGER CHECK (card_exp_month >= 1 AND card_exp_month <= 12),
    card_exp_year INTEGER CHECK (card_exp_year >= 2020),
    bank_name VARCHAR(100),
    bank_last4 VARCHAR(4),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment webhooks table for tracking Stripe events
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_guard_id ON payments(guard_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_escrow_job_id ON escrow(job_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow(status);
CREATE INDEX IF NOT EXISTS idx_escrow_client_id ON escrow(client_id);
CREATE INDEX IF NOT EXISTS idx_escrow_guard_id ON escrow(guard_id);

CREATE INDEX IF NOT EXISTS idx_disputes_job_id ON payment_disputes(job_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator_id ON payment_disputes(initiator_id);

CREATE INDEX IF NOT EXISTS idx_payouts_job_id ON guard_payouts(job_id);
CREATE INDEX IF NOT EXISTS idx_payouts_guard_id ON guard_payouts(guard_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON guard_payouts(status);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);

CREATE INDEX IF NOT EXISTS idx_webhooks_event_id ON payment_webhooks(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON payment_webhooks(processed);

-- Add payment-related columns to existing jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'completed', 'refunded', 'disputed'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(3) DEFAULT 'USD';

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escrow_updated_at BEFORE UPDATE ON escrow FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON payment_disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON guard_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate fees
CREATE OR REPLACE FUNCTION calculate_payment_fees(amount DECIMAL(10,2))
RETURNS TABLE(platform_fee DECIMAL(10,2), stripe_fee DECIMAL(10,2), net_amount DECIMAL(10,2)) AS $$
BEGIN
    RETURN QUERY SELECT
        (amount * 0.05)::DECIMAL(10,2) as platform_fee,
        ((amount * 0.029) + 0.30)::DECIMAL(10,2) as stripe_fee,
        (amount - (amount * 0.05) - ((amount * 0.029) + 0.30))::DECIMAL(10,2) as net_amount;
END;
$$ LANGUAGE plpgsql;

-- Create function to create escrow record
CREATE OR REPLACE FUNCTION create_escrow_record()
RETURNS TRIGGER AS $$
DECLARE
    fees RECORD;
BEGIN
    -- Calculate fees
    SELECT * INTO fees FROM calculate_payment_fees(NEW.amount);
    
    -- Create escrow record
    INSERT INTO escrow (
        job_id,
        payment_intent_id,
        amount,
        client_id,
        guard_id,
        platform_fee,
        stripe_fee,
        net_amount,
        status
    ) VALUES (
        NEW.job_id,
        NEW.stripe_payment_intent_id,
        NEW.amount,
        NEW.client_id,
        NEW.guard_id,
        fees.platform_fee,
        fees.stripe_fee,
        fees.net_amount,
        'pending'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create escrow record when payment is confirmed
CREATE TRIGGER create_escrow_on_payment_confirmed
    AFTER UPDATE OF status ON payments
    FOR EACH ROW
    WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed')
    EXECUTE FUNCTION create_escrow_record();

-- Create RLS policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Payments RLS policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = guard_id);

CREATE POLICY "Clients can create payments for their jobs" ON payments
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own payments" ON payments
    FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = guard_id);

-- Escrow RLS policies
CREATE POLICY "Users can view escrow for their jobs" ON escrow
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = guard_id);

CREATE POLICY "System can manage escrow" ON escrow
    FOR ALL USING (true);

-- Disputes RLS policies
CREATE POLICY "Users can view disputes for their jobs" ON payment_disputes
    FOR SELECT USING (
        auth.uid() IN (
            SELECT client_id FROM jobs WHERE id = job_id
            UNION
            SELECT guard_id FROM jobs WHERE id = job_id
        )
    );

CREATE POLICY "Users can create disputes for their jobs" ON payment_disputes
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT client_id FROM jobs WHERE id = job_id
            UNION
            SELECT guard_id FROM jobs WHERE id = job_id
        )
    );

-- Payouts RLS policies
CREATE POLICY "Guards can view their own payouts" ON guard_payouts
    FOR SELECT USING (auth.uid() = guard_id);

CREATE POLICY "System can manage payouts" ON guard_payouts
    FOR ALL USING (true);

-- Payment methods RLS policies
CREATE POLICY "Users can view their own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own payment methods" ON payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Webhooks RLS policies (admin only)
CREATE POLICY "Only admins can view webhooks" ON payment_webhooks
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM user_roles WHERE role = 'admin'
    ));

-- Insert default data
INSERT INTO payment_webhooks (stripe_event_id, event_type, event_data, processed)
VALUES 
    ('default_webhook', 'system.initialized', '{"message": "Payment system initialized"}', true)
ON CONFLICT (stripe_event_id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

