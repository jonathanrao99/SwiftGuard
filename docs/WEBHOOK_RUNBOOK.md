# Stripe Webhook Runbook

## Overview

This runbook provides procedures for managing Stripe webhooks in the SwiftGuard application, including testing, monitoring, and troubleshooting.

## Webhook Configuration

### Endpoint URL
```
https://tidzeckbgcyxyzihbdun.supabase.co/functions/v1/stripe-webhook
```

### Required Events
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_method.attached`
- `customer.created`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Testing Procedures

### 1. Webhook Endpoint Validation

```bash
# Test webhook endpoint is reachable
curl -X POST https://tidzeckbgcyxyzihbdun.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test_signature" \
  -d '{"type": "test", "data": {"object": {"id": "test"}}}'
```

### 2. Test Event Generation

```bash
# Generate test payment_intent.succeeded event
stripe events create \
  --type payment_intent.succeeded \
  --data-object payment_intent:pi_test_123 \
  --api-key sk_test_...
```

### 3. Idempotency Testing

```bash
# Send same event multiple times
for i in {1..3}; do
  curl -X POST https://tidzeckbgcyxyzihbdun.supabase.co/functions/v1/stripe-webhook \
    -H "Content-Type: application/json" \
    -H "Stripe-Signature: $SIGNATURE" \
    -d "$EVENT_PAYLOAD"
done
```

## Monitoring & Alerting

### Key Metrics
- Webhook delivery success rate
- Webhook processing time
- Failed webhook retries
- Event processing errors

### Alert Thresholds
- Success rate < 95%
- Processing time > 5 seconds
- Failed retries > 3
- Error rate > 1%

### Monitoring Queries

```sql
-- Webhook success rate (last 24 hours)
SELECT 
  COUNT(*) as total_events,
  COUNT(CASE WHEN processed = true THEN 1 END) as successful,
  ROUND(COUNT(CASE WHEN processed = true THEN 1 END)::numeric / COUNT(*) * 100, 2) as success_rate
FROM payment_webhooks 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Failed webhook events
SELECT 
  stripe_event_id,
  event_type,
  processing_error,
  created_at
FROM payment_webhooks 
WHERE processed = false 
AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Troubleshooting

### Common Issues

#### 1. Webhook Signature Verification Failed
**Symptoms**: 400 Bad Request, signature verification errors
**Causes**: 
- Incorrect webhook secret
- Malformed request
- Clock skew

**Resolution**:
```bash
# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Check system time
date

# Test signature verification
stripe webhooks test --endpoint your_webhook_url
```

#### 2. Event Processing Timeout
**Symptoms**: 504 Gateway Timeout, processing errors
**Causes**:
- Database connection issues
- External API delays
- Complex processing logic

**Resolution**:
```bash
# Check database connections
supabase db ping

# Monitor processing time
SELECT 
  stripe_event_id,
  event_type,
  EXTRACT(EPOCH FROM (processed_at - created_at)) as processing_time_seconds
FROM payment_webhooks 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY processing_time_seconds DESC;
```

#### 3. Duplicate Event Processing
**Symptoms**: Duplicate payments, data inconsistencies
**Causes**:
- Missing idempotency handling
- Race conditions
- Webhook retries

**Resolution**:
```sql
-- Check for duplicate events
SELECT 
  stripe_event_id,
  COUNT(*) as event_count
FROM payment_webhooks 
GROUP BY stripe_event_id 
HAVING COUNT(*) > 1;

-- Implement idempotency
INSERT INTO payment_webhooks (stripe_event_id, event_type, event_data, processed)
VALUES ($1, $2, $3, false)
ON CONFLICT (stripe_event_id) DO NOTHING;
```

## Recovery Procedures

### 1. Replay Failed Events

```sql
-- Get failed events for replay
SELECT stripe_event_id, event_type, event_data
FROM payment_webhooks 
WHERE processed = false 
AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at;

-- Replay specific event
UPDATE payment_webhooks 
SET processed = false, processing_error = NULL
WHERE stripe_event_id = 'evt_...';
```

### 2. Manual Event Processing

```bash
# Process specific payment intent
curl -X POST https://tidzeckbgcyxyzihbdun.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: $SIGNATURE" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_...",
        "amount": 15000,
        "currency": "usd",
        "status": "succeeded"
      }
    }
  }'
```

### 3. Data Consistency Checks

```sql
-- Check payment consistency
SELECT 
  p.id,
  p.stripe_payment_intent_id,
  p.status as db_status,
  pw.event_type,
  pw.processed
FROM payments p
LEFT JOIN payment_webhooks pw ON p.stripe_payment_intent_id = pw.stripe_event_id
WHERE p.created_at >= NOW() - INTERVAL '24 hours';

-- Find orphaned payments
SELECT *
FROM payments 
WHERE stripe_payment_intent_id NOT IN (
  SELECT stripe_event_id FROM payment_webhooks
);
```

## Security Considerations

### 1. Webhook Signature Verification
- Always verify Stripe signatures
- Use secure webhook secrets
- Implement proper error handling

### 2. Rate Limiting
- Implement webhook rate limiting
- Monitor for abuse patterns
- Use exponential backoff

### 3. Data Validation
- Validate all incoming data
- Sanitize event payloads
- Implement proper logging

## Performance Optimization

### 1. Database Optimization
```sql
-- Create indexes for webhook processing
CREATE INDEX CONCURRENTLY payment_webhooks_processed_idx 
ON payment_webhooks (processed, created_at);

CREATE INDEX CONCURRENTLY payment_webhooks_event_type_idx 
ON payment_webhooks (event_type, created_at);
```

### 2. Processing Optimization
- Implement async processing
- Use database transactions
- Batch similar events

### 3. Monitoring Optimization
- Set up proper alerting
- Implement health checks
- Monitor resource usage

## Maintenance Procedures

### Daily
- Check webhook success rates
- Review failed events
- Monitor processing times

### Weekly
- Analyze webhook patterns
- Review error logs
- Update monitoring thresholds

### Monthly
- Review webhook configuration
- Test disaster recovery procedures
- Update documentation

## Emergency Contacts

- **Primary**: Development Team Lead
- **Secondary**: CTO
- **Stripe Support**: support@stripe.com
- **Escalation**: CEO (for critical issues)

## Related Documentation

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [SwiftGuard Payment Flow](./PAYMENT_FLOW.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Monitoring Setup](./MONITORING_SETUP.md)

---

*Last Updated: January 2025*
*Next Review: February 2025*

