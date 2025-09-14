# SwiftGuard Analytics Events Taxonomy

## Overview

This document defines the analytics events taxonomy for SwiftGuard, including event names, properties, and usage guidelines. All events are tracked through the `track-event` edge function and stored in the `analytics_events` table.

## Event Categories

### 1. Application Lifecycle Events

#### `app_open`
**Description**: User opens the application
**Properties**:
- `platform`: 'ios' | 'android' | 'web'
- `app_version`: string
- `timestamp`: ISO string

#### `app_close`
**Description**: User closes the application
**Properties**:
- `session_duration`: number (seconds)
- `timestamp`: ISO string

### 2. Authentication Events

#### `auth_success`
**Description**: User successfully authenticates
**Properties**:
- `user_id`: string
- `auth_method`: 'email' | 'phone' | 'social'
- `timestamp`: ISO string

#### `auth_failed`
**Description**: User authentication fails
**Properties**:
- `auth_method`: 'email' | 'phone' | 'social'
- `error_type`: string
- `timestamp`: ISO string

### 3. Job Creation Flow

#### `job_create_started`
**Description**: User begins creating a job
**Properties**:
- `user_id`: string
- `job_type`: 'event' | 'building' | 'payment'
- `timestamp`: ISO string

#### `job_create_completed`
**Description**: User successfully creates a job
**Properties**:
- `user_id`: string
- `job_id`: string
- `job_type`: 'event' | 'building' | 'payment'
- `duration`: number (seconds)
- `timestamp`: ISO string

#### `job_create_failed`
**Description**: Job creation fails
**Properties**:
- `user_id`: string
- `job_type`: 'event' | 'building' | 'payment'
- `error_type`: string
- `step_failed`: string
- `timestamp`: ISO string

#### `job_posted`
**Description**: Job is posted and available to guards
**Properties**:
- `user_id`: string
- `job_id`: string
- `job_type`: 'event' | 'building' | 'payment'
- `pay_amount`: number
- `num_guards`: number
- `timestamp`: ISO string

#### `job_cancelled`
**Description**: Job is cancelled by client
**Properties**:
- `user_id`: string
- `job_id`: string
- `cancellation_reason`: string
- `timestamp`: ISO string

### 4. Guard Interaction Events

#### `guard_accept`
**Description**: Guard accepts a job
**Properties**:
- `guard_id`: string
- `job_id`: string
- `response_time`: number (minutes)
- `timestamp`: ISO string

#### `guard_reject`
**Description**: Guard rejects a job
**Properties**:
- `guard_id`: string
- `job_id`: string
- `rejection_reason`: string
- `response_time`: number (minutes)
- `timestamp`: ISO string

### 5. Payment Events

#### `payment_started`
**Description**: Payment process begins
**Properties**:
- `user_id`: string
- `job_id`: string
- `amount`: number
- `currency`: string
- `payment_method`: string
- `timestamp`: ISO string

#### `payment_succeeded`
**Description**: Payment completes successfully
**Properties**:
- `user_id`: string
- `job_id`: string
- `amount`: number
- `currency`: string
- `payment_method`: string
- `processing_time`: number (seconds)
- `timestamp`: ISO string

#### `payment_failed`
**Description**: Payment fails
**Properties**:
- `user_id`: string
- `job_id`: string
- `amount`: number
- `currency`: string
- `payment_method`: string
- `error_type`: string
- `timestamp`: ISO string

### 6. Emergency Events

#### `panic_triggered`
**Description**: Emergency alert is triggered
**Properties**:
- `user_id`: string
- `job_id`: string (optional)
- `location_available`: boolean
- `timestamp`: ISO string

#### `panic_resolved`
**Description**: Emergency alert is resolved
**Properties**:
- `user_id`: string
- `alert_id`: string
- `resolution_time`: number (minutes)
- `resolved_by`: string
- `timestamp`: ISO string

### 7. Check-in/Check-out Events

#### `check_in`
**Description**: Guard checks in to a job
**Properties**:
- `guard_id`: string
- `job_id`: string
- `location_accuracy`: number
- `timestamp`: ISO string

#### `check_out`
**Description**: Guard checks out from a job
**Properties**:
- `guard_id`: string
- `job_id`: string
- `duration`: number (hours)
- `timestamp`: ISO string

### 8. Communication Events

#### `message_sent`
**Description**: User sends a message
**Properties**:
- `user_id`: string
- `job_id`: string
- `message_type`: 'text' | 'image' | 'location'
- `timestamp`: ISO string

#### `message_received`
**Description**: User receives a message
**Properties**:
- `user_id`: string
- `job_id`: string
- `message_type`: 'text' | 'image' | 'location'
- `timestamp`: ISO string

### 9. Review Events

#### `review_submitted`
**Description**: User submits a review
**Properties**:
- `user_id`: string
- `job_id`: string
- `rating`: number (1-5)
- `review_type`: 'client_to_guard' | 'guard_to_client'
- `timestamp`: ISO string

### 10. System Events

#### `analytics_refresh`
**Description**: Analytics materialized views are refreshed
**Properties**:
- `views_refreshed`: number
- `timestamp`: ISO string

## Event Properties Guidelines

### Required Properties
- `timestamp`: Always include ISO timestamp
- `user_id`: Include when user is authenticated
- `session_id`: Include for session-based events

### Optional Properties
- `platform`: Include for platform-specific events
- `app_version`: Include for version-specific tracking
- `location_*`: Include for location-based events
- `error_type`: Include for error events
- `duration`: Include for time-based events

### Prohibited Properties
- Personal Identifiable Information (PII)
- Passwords or authentication tokens
- Credit card numbers or sensitive financial data
- IP addresses (handled automatically)
- Email addresses or phone numbers

## Data Retention

- **Raw Events**: 90 days
- **Aggregated Data**: 2 years
- **Materialized Views**: Refreshed hourly
- **Analytics Reports**: 1 year

## Privacy Considerations

1. **Data Minimization**: Only collect necessary data
2. **Anonymization**: User IDs are hashed in analytics
3. **Consent**: Users can opt-out of analytics
4. **GDPR Compliance**: EU users have data deletion rights
5. **Data Encryption**: All data encrypted at rest

## Usage Examples

### Client-side Tracking
```typescript
import { analytics } from '../services/AnalyticsService';

// Track app open
await analytics.track('app_open', {
  platform: 'ios',
  app_version: '1.0.0'
});

// Track critical payment event
await analytics.trackCritical('payment_succeeded', {
  job_id: 'job_123',
  amount: 150.00,
  currency: 'USD'
}, userId);
```

### Server-side Tracking
```typescript
// In edge functions
await supabase.functions.invoke('track-event', {
  body: {
    eventName: 'guard_accept',
    properties: {
      job_id: 'job_123',
      response_time: 5.2
    },
    userId: guardId
  }
});
```

## Monitoring & Alerts

### Key Metrics to Monitor
- Event volume by type
- Error rates in event tracking
- Data quality issues
- Performance impact

### Alert Thresholds
- Event tracking failure rate > 5%
- Missing critical events
- Data quality issues
- Performance degradation

## Version History

- **v1.0** (January 2025): Initial taxonomy definition
- **v1.1** (Future): Additional events as features are added

---

*This taxonomy is maintained by the SwiftGuard development team and should be updated as new features are added.*

