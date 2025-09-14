# SwiftGuard Backup & Disaster Recovery Plan

## Overview

This document outlines the backup and disaster recovery procedures for SwiftGuard, including data protection, recovery procedures, and business continuity planning.

## Current Infrastructure

### Database
- **Provider**: Supabase (PostgreSQL 15.8.1)
- **Region**: us-east-2 (Ohio)
- **Backup Strategy**: Automated daily backups with 7-day retention
- **Point-in-Time Recovery**: Available for last 7 days

### Application
- **Frontend**: React Native (Expo)
- **Backend**: Supabase Edge Functions
- **CDN**: Supabase CDN
- **Monitoring**: Sentry + Custom analytics

## Backup Configuration

### 1. Database Backups

#### Automated Backups
- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 7 days
- **Type**: Full database dumps
- **Location**: Supabase managed storage
- **Encryption**: AES-256 encryption at rest

#### Manual Backups
```bash
# Create manual backup
supabase db dump --project-ref tidzeckbgcyxyzihbdun --file backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup integrity
pg_restore --list backup_file.sql
```

#### Point-in-Time Recovery
- **Available**: Last 7 days
- **Granularity**: 1-minute intervals
- **Access**: Via Supabase dashboard or CLI

### 2. Application Code Backups

#### Git Repository
- **Primary**: GitHub (main branch)
- **Backup**: Local development copies
- **Retention**: Full history maintained
- **Access**: 24/7 via GitHub

#### Edge Functions
- **Storage**: Supabase Edge Functions
- **Backup**: Git repository
- **Versioning**: Git tags for releases
- **Deployment**: Automated via GitHub Actions

### 3. Configuration Backups

#### Environment Variables
- **Storage**: GitHub Secrets
- **Backup**: Local encrypted storage
- **Access**: Restricted to authorized personnel
- **Rotation**: Quarterly review

#### Database Schema
- **Storage**: Supabase migrations
- **Backup**: Git repository
- **Versioning**: Migration files
- **Documentation**: Schema documentation

## Disaster Recovery Procedures

### 1. Database Recovery

#### Full Database Restore
```bash
# Restore from backup
supabase db reset --project-ref tidzeckbgcyxyzihbdun
psql -h db.tidzeckbgcyxyzihbdun.supabase.co -U postgres -d postgres < backup_file.sql

# Verify restore
supabase db ping --project-ref tidzeckbgcyxyzihbdun
```

#### Point-in-Time Recovery
```bash
# Restore to specific timestamp
supabase db restore --project-ref tidzeckbgcyxyzihbdun --timestamp "2025-01-15 14:30:00"

# Verify recovery
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM jobs;
SELECT COUNT(*) FROM payments;
```

#### Partial Data Recovery
```sql
-- Restore specific table
CREATE TABLE users_backup AS SELECT * FROM users WHERE created_at >= '2025-01-15';

-- Restore specific records
INSERT INTO users (id, email, role, created_at)
SELECT id, email, role, created_at
FROM users_backup
WHERE id NOT IN (SELECT id FROM users);
```

### 2. Application Recovery

#### Edge Functions Recovery
```bash
# Deploy from Git
git checkout main
supabase functions deploy --project-ref tidzeckbgcyxyzihbdun

# Verify deployment
supabase functions list --project-ref tidzeckbgcyxyzihbdun
```

#### Frontend Recovery
```bash
# Build and deploy
npm install
npm run build
eas build --platform all --non-interactive
```

### 3. Service Recovery

#### Supabase Service Recovery
1. **Check Service Status**: https://status.supabase.com
2. **Contact Support**: support@supabase.com
3. **Escalate**: If critical, contact Supabase team directly
4. **Monitor**: Watch for service restoration

#### Stripe Service Recovery
1. **Check Service Status**: https://status.stripe.com
2. **Contact Support**: support@stripe.com
3. **Review Transactions**: Check for missed payments
4. **Reconcile**: Ensure payment consistency

## Recovery Time Objectives (RTO)

| Component | RTO | RPO | Priority |
|-----------|-----|-----|----------|
| Database | 1 hour | 15 minutes | Critical |
| Edge Functions | 30 minutes | 5 minutes | High |
| Frontend App | 2 hours | 1 hour | Medium |
| Analytics | 4 hours | 1 hour | Low |

## Recovery Point Objectives (RPO)

- **Critical Data**: 15 minutes
- **User Data**: 1 hour
- **Analytics Data**: 4 hours
- **Logs**: 24 hours

## Testing Procedures

### 1. Quarterly Backup Tests

#### Database Backup Test
```bash
# Create test backup
supabase db dump --project-ref tidzeckbgcyxyzihbdun --file test_backup.sql

# Restore to test environment
supabase db reset --project-ref test-project
psql -h test-db.supabase.co -U postgres -d postgres < test_backup.sql

# Verify data integrity
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM jobs;
SELECT COUNT(*) FROM payments;
```

#### Application Recovery Test
```bash
# Deploy to test environment
supabase functions deploy --project-ref test-project

# Test critical endpoints
curl -X POST https://test-project.supabase.co/functions/v1/list-guards
curl -X POST https://test-project.supabase.co/functions/v1/get-payment-methods
```

### 2. Annual Disaster Recovery Drill

#### Scenario: Complete Data Center Failure
1. **Activate**: Disaster recovery procedures
2. **Restore**: Database from latest backup
3. **Deploy**: Application to backup region
4. **Test**: All critical functions
5. **Document**: Lessons learned

#### Scenario: Ransomware Attack
1. **Isolate**: Affected systems
2. **Assess**: Damage extent
3. **Restore**: From clean backups
4. **Verify**: Data integrity
5. **Monitor**: For re-infection

## Monitoring & Alerting

### 1. Backup Monitoring

#### Daily Checks
- Backup completion status
- Backup file integrity
- Storage usage
- Error logs

#### Weekly Checks
- Backup retention compliance
- Recovery time tests
- Storage cost analysis
- Performance impact

### 2. Disaster Recovery Monitoring

#### Real-time Monitoring
- Database connectivity
- Application availability
- Service health checks
- Performance metrics

#### Alert Thresholds
- Database downtime > 5 minutes
- Application errors > 1%
- Backup failures
- Recovery time > RTO

## Business Continuity

### 1. Communication Plan

#### Internal Communication
- **Primary**: Slack #incidents channel
- **Secondary**: Email alerts
- **Escalation**: Phone calls for critical issues

#### External Communication
- **Users**: In-app notifications
- **Partners**: Email notifications
- **Media**: Press releases if needed

### 2. Service Degradation Procedures

#### Graceful Degradation
1. **Read-only Mode**: Disable writes, enable reads
2. **Limited Features**: Disable non-critical features
3. **Manual Processing**: Enable manual payment processing
4. **Communication**: Notify users of limitations

#### Emergency Procedures
1. **Activate**: Emergency response team
2. **Assess**: Impact and timeline
3. **Execute**: Recovery procedures
4. **Communicate**: Status updates
5. **Monitor**: Recovery progress

## Compliance & Legal

### 1. Data Protection
- **GDPR**: EU user data protection
- **CCPA**: California privacy compliance
- **SOC 2**: Security compliance
- **PCI DSS**: Payment data security

### 2. Legal Requirements
- **Data Retention**: 7 years for financial records
- **Audit Trails**: Complete transaction logs
- **Privacy**: User data protection
- **Disclosure**: Breach notification requirements

## Cost Considerations

### 1. Backup Costs
- **Storage**: $0.10/GB/month
- **Transfer**: $0.09/GB
- **Retention**: 7-day policy
- **Annual Cost**: ~$500

### 2. Recovery Costs
- **Emergency Response**: $2,000/hour
- **Data Recovery**: $5,000/incident
- **Business Impact**: $10,000/hour downtime
- **Annual Budget**: $50,000

## Maintenance Schedule

### Daily
- [ ] Check backup completion
- [ ] Monitor system health
- [ ] Review error logs
- [ ] Verify data integrity

### Weekly
- [ ] Test backup restoration
- [ ] Review recovery procedures
- [ ] Update documentation
- [ ] Monitor costs

### Monthly
- [ ] Full disaster recovery test
- [ ] Review and update procedures
- [ ] Train staff on procedures
- [ ] Update contact information

### Quarterly
- [ ] Comprehensive backup test
- [ ] Review RTO/RPO objectives
- [ ] Update disaster recovery plan
- [ ] Conduct tabletop exercises

### Annually
- [ ] Full disaster recovery drill
- [ ] Review and update plan
- [ ] Train all staff
- [ ] Update legal requirements

## Emergency Contacts

### Internal Team
- **Primary**: Development Team Lead
- **Secondary**: CTO
- **Tertiary**: CEO
- **On-call**: 24/7 rotation

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

## Documentation Updates

This document is reviewed and updated:
- **Quarterly**: Minor updates and corrections
- **Annually**: Major revisions and improvements
- **After Incidents**: Lessons learned integration
- **After Tests**: Procedure refinements

---

*Last Updated: January 2025*
*Next Review: April 2025*
*Document Owner: CTO*
*Approved By: CEO*

