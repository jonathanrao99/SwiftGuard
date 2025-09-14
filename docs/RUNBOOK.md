# SwiftGuard Operational Runbook

## Overview

This runbook provides step-by-step procedures for common operational issues, incident response, and maintenance tasks for the SwiftGuard platform.

## Incident Response

### Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **P0** | Critical - System down, payment failures | 15 minutes | CTO → CEO |
| **P1** | High - Performance degradation, high error rates | 1 hour | Team Lead → CTO |
| **P2** | Medium - Non-critical features affected | 4 hours | Developer → Team Lead |
| **P3** | Low - Minor issues, cosmetic problems | 24 hours | Developer |

### Incident Response Process

1. **Detection**: Monitor alerts and user reports
2. **Assessment**: Determine severity and impact
3. **Response**: Execute appropriate procedures
4. **Communication**: Notify stakeholders
5. **Resolution**: Fix the issue
6. **Post-mortem**: Document lessons learned

## Common Issues & Solutions

### 1. Elevated 429 Rate Limit Errors

#### Symptoms
- High rate of 429 HTTP responses
- Users reporting "too many requests" errors
- API endpoints returning rate limit headers

#### Investigation
```sql
-- Check rate limit violations
SELECT 
  endpoint,
  COUNT(*) as violation_count,
  DATE_TRUNC('hour', created_at) as hour
FROM rate_limits 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY endpoint, hour
ORDER BY violation_count DESC;

-- Check user-specific violations
SELECT 
  user_id,
  endpoint,
  COUNT(*) as violations
FROM rate_limits 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY user_id, endpoint
HAVING COUNT(*) > 10
ORDER BY violations DESC;
```

#### Resolution
1. **Immediate**: Check for abuse or legitimate high usage
2. **Short-term**: Increase rate limits if justified
3. **Long-term**: Implement user-specific limits or caching

```sql
-- Increase rate limits temporarily
UPDATE rate_limits 
SET max_requests = max_requests * 2
WHERE endpoint = 'api';

-- Add user-specific rate limiting
INSERT INTO rate_limits (user_id, endpoint, max_requests, window_minutes)
VALUES ('user_id', 'api', 200, 60);
```

### 2. Stripe Payment Errors

#### Symptoms
- Payment failures in logs
- Users reporting payment issues
- Stripe dashboard showing errors

#### Investigation
```sql
-- Check payment failures
SELECT 
  p.id,
  p.stripe_payment_intent_id,
  p.status,
  p.failure_reason,
  p.created_at
FROM payments p
WHERE p.status = 'failed'
AND p.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC;

-- Check Stripe webhook processing
SELECT 
  stripe_event_id,
  event_type,
  processed,
  processing_error,
  created_at
FROM payment_webhooks
WHERE created_at >= NOW() - INTERVAL '1 hour'
AND processed = false
ORDER BY created_at DESC;
```

#### Resolution
1. **Check Stripe Status**: https://status.stripe.com
2. **Review Error Logs**: Check specific error messages
3. **Retry Failed Payments**: Use Stripe dashboard
4. **Update Webhook Processing**: Fix any processing errors

```bash
# Retry failed payment
stripe payment_intents update pi_... --confirm

# Check webhook endpoint
curl -X POST https://tidzeckbgcyxyzihbdun.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: $SIGNATURE" \
  -d "$EVENT_PAYLOAD"
```

### 3. Supabase Outage

#### Symptoms
- Database connection errors
- Edge function timeouts
- Authentication failures

#### Investigation
```bash
# Check Supabase status
curl -f https://status.supabase.com/api/v2/status.json

# Test database connectivity
supabase db ping --project-ref tidzeckbgcyxyzihbdun

# Check edge function health
curl -f https://tidzeckbgcyxyzihbdun.supabase.co/functions/v1/list-guards \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"limit": 1}'
```

#### Resolution
1. **Check Status Page**: https://status.supabase.com
2. **Contact Support**: support@supabase.com
3. **Implement Fallback**: Use cached data if available
4. **Communicate**: Notify users of service issues

### 4. Sentry Error Spike

#### Symptoms
- High error rate in Sentry
- Multiple error types
- Performance degradation

#### Investigation
```sql
-- Check error patterns
SELECT 
  event_name,
  COUNT(*) as error_count,
  DATE_TRUNC('hour', ts) as hour
FROM analytics_events
WHERE event_name LIKE '%error%'
AND ts >= NOW() - INTERVAL '1 hour'
GROUP BY event_name, hour
ORDER BY error_count DESC;
```

#### Resolution
1. **Identify Root Cause**: Check Sentry for error patterns
2. **Fix Critical Issues**: Address P0/P1 errors first
3. **Monitor**: Watch for error rate reduction
4. **Document**: Update error handling procedures

### 5. Emergency Alert Storm

#### Symptoms
- High volume of emergency alerts
- System performance issues
- Notification service overload

#### Investigation
```sql
-- Check emergency alert volume
SELECT 
  COUNT(*) as alert_count,
  DATE_TRUNC('hour', alert_time) as hour
FROM emergency_alerts
WHERE alert_time >= NOW() - INTERVAL '1 hour'
GROUP BY hour
ORDER BY hour DESC;

-- Check alert patterns
SELECT 
  guard_id,
  COUNT(*) as alert_count
FROM emergency_alerts
WHERE alert_time >= NOW() - INTERVAL '1 hour'
GROUP BY guard_id
HAVING COUNT(*) > 5
ORDER BY alert_count DESC;
```

#### Resolution
1. **Verify Legitimacy**: Check if alerts are real emergencies
2. **Rate Limit**: Implement emergency alert rate limiting
3. **Escalate**: Contact emergency services if needed
4. **Monitor**: Watch for alert volume reduction

## Maintenance Procedures

### 1. Database Maintenance

#### Daily
```sql
-- Check database health
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;

-- Check for long-running queries
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

#### Weekly
```sql
-- Update table statistics
ANALYZE;

-- Check for unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0
AND idx_tup_fetch = 0;
```

#### Monthly
```sql
-- Vacuum analyze
VACUUM ANALYZE;

-- Check database size
SELECT 
  pg_size_pretty(pg_database_size('postgres')) as database_size;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. Application Maintenance

#### Daily
```bash
# Check edge function health
supabase functions list --project-ref tidzeckbgcyxyzihbdun

# Check application logs
supabase logs --project-ref tidzeckbgcyxyzihbdun --service edge-function

# Monitor performance
curl -w "@curl-format.txt" -o /dev/null -s https://tidzeckbgcyxyzihbdun.supabase.co/functions/v1/list-guards
```

#### Weekly
```bash
# Update dependencies
npm audit
npm update

# Check for security vulnerabilities
npm audit --audit-level moderate

# Review error logs
supabase logs --project-ref tidzeckbgcyxyzihbdun --service edge-function --level error
```

#### Monthly
```bash
# Full system health check
supabase status --project-ref tidzeckbgcyxyzihbdun

# Review performance metrics
supabase logs --project-ref tidzeckbgcyxyzihbdun --service edge-function --level info

# Check resource usage
supabase projects list
```

### 3. Security Maintenance

#### Daily
```sql
-- Check for suspicious activity
SELECT 
  user_id,
  COUNT(*) as request_count,
  DATE_TRUNC('hour', created_at) as hour
FROM rate_limits
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY user_id, hour
HAVING COUNT(*) > 100
ORDER BY request_count DESC;

-- Check for failed authentication attempts
SELECT 
  COUNT(*) as failed_attempts,
  DATE_TRUNC('hour', ts) as hour
FROM analytics_events
WHERE event_name = 'auth_failed'
AND ts >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

#### Weekly
```bash
# Review security logs
supabase logs --project-ref tidzeckbgcyxyzihbdun --service auth --level error

# Check for unusual patterns
grep -i "error\|failed\|unauthorized" logs/application.log | tail -100
```

#### Monthly
```bash
# Security audit
npm audit --audit-level high

# Review access logs
supabase logs --project-ref tidzeckbgcyxyzihbdun --service auth --level info

# Check for data breaches
SELECT COUNT(*) FROM analytics_events WHERE props::text LIKE '%password%';
```

## Performance Optimization

### 1. Database Optimization

#### Query Optimization
```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check for missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;
```

#### Index Optimization
```sql
-- Create missing indexes
CREATE INDEX CONCURRENTLY idx_users_role_active ON users (role, is_active);
CREATE INDEX CONCURRENTLY idx_jobs_status_created ON jobs (status, created_at);
CREATE INDEX CONCURRENTLY idx_payments_status_created ON payments (status, created_at);

-- Remove unused indexes
DROP INDEX CONCURRENTLY idx_unused_index;
```

### 2. Application Optimization

#### Edge Function Optimization
```typescript
// Implement caching
const cache = new Map();

export async function cachedFunction(key: string, fn: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await fn();
  cache.set(key, result);
  
  // Set expiration
  setTimeout(() => cache.delete(key), 300000); // 5 minutes
  
  return result;
}
```

#### Database Connection Optimization
```typescript
// Implement connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Monitoring & Alerting

### 1. Key Metrics

#### Application Metrics
- Response time (p95, p99)
- Error rate
- Throughput (requests/second)
- Availability

#### Business Metrics
- Daily active users
- Payment success rate
- Guard acceptance rate
- Emergency response time

#### Infrastructure Metrics
- Database connections
- Memory usage
- CPU utilization
- Disk space

### 2. Alert Configuration

#### Critical Alerts
- Database downtime > 5 minutes
- Payment failure rate > 5%
- Emergency response time > 10 minutes
- Error rate > 2%

#### Warning Alerts
- Response time > 1 second
- Memory usage > 80%
- Disk space > 85%
- Rate limit violations > 10%

### 3. Dashboard Queries

#### Real-time Monitoring
```sql
-- Current system status
SELECT 
  'users' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as last_activity
FROM users
UNION ALL
SELECT 
  'jobs' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as last_activity
FROM jobs
UNION ALL
SELECT 
  'payments' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as last_activity
FROM payments;
```

#### Performance Monitoring
```sql
-- Response time trends
SELECT 
  DATE_TRUNC('hour', ts) as hour,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_response_time
FROM payment_webhooks
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

## Emergency Procedures

### 1. System Down

1. **Assess**: Determine scope and impact
2. **Communicate**: Notify stakeholders
3. **Restore**: Execute recovery procedures
4. **Monitor**: Watch for stability
5. **Document**: Record incident details

### 2. Data Breach

1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope of breach
3. **Notify**: Contact legal and compliance
4. **Investigate**: Find root cause
5. **Remediate**: Fix security issues
6. **Report**: Notify authorities if required

### 3. Payment Issues

1. **Verify**: Check Stripe status
2. **Assess**: Determine impact scope
3. **Communicate**: Notify affected users
4. **Resolve**: Fix payment processing
5. **Reconcile**: Ensure data consistency
6. **Monitor**: Watch for recurring issues

## Contact Information

### Internal Team
- **Primary On-call**: +1-555-0123
- **Secondary On-call**: +1-555-0124
- **Team Lead**: team-lead@swiftguard.com
- **CTO**: cto@swiftguard.com

### External Vendors
- **Supabase**: support@supabase.com
- **Stripe**: support@stripe.com
- **Sentry**: support@sentry.io
- **AWS**: Enterprise support

### Emergency Services
- **Fire**: 911
- **Police**: 911
- **Medical**: 911
- **Security**: Building security

---

*Last Updated: January 2025*
*Next Review: April 2025*
*Document Owner: Operations Team*
*Approved By: CTO*

