/**
 * Sentry Configuration for Supabase Edge Functions
 * Includes PII scrubbing and privacy filters
 */

import * as Sentry from "https://deno.land/x/sentry@7.31.1/index.mjs";

// PII scrubbing patterns
const PII_PATTERNS = {
  phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  jwt: /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
  apiKey: /\b[A-Za-z0-9]{20,}\b/g,
  coordinates: /\b-?\d{1,3}\.\d{4,},\s*-?\d{1,3}\.\d{4,}\b/g,
};

// PII scrubbing function
function scrubPII(text: string): string {
  let scrubbed = text;

  // Phone numbers - keep last 4 digits
  scrubbed = scrubbed.replace(PII_PATTERNS.phone, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `***-***-${digits.slice(-4)}`;
    }
    return '***-***-****';
  });

  // Email addresses - keep domain
  scrubbed = scrubbed.replace(PII_PATTERNS.email, (match) => {
    const [local, domain] = match.split('@');
    if (local.length > 2) {
      return `${local.substring(0, 2)}***@${domain}`;
    }
    return `***@${domain}`;
  });

  // Credit card numbers - keep last 4 digits
  scrubbed = scrubbed.replace(PII_PATTERNS.creditCard, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `****-****-****-${digits.slice(-4)}`;
    }
    return '****-****-****-****';
  });

  // SSN - keep last 4 digits
  scrubbed = scrubbed.replace(PII_PATTERNS.ssn, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `***-**-${digits.slice(-4)}`;
    }
    return '***-**-****';
  });

  // JWT tokens - mask middle part
  scrubbed = scrubbed.replace(PII_PATTERNS.jwt, (match) => {
    const parts = match.split('.');
    if (parts.length === 3) {
      return `${parts[0]}.***.${parts[2]}`;
    }
    return '***';
  });

  // API keys - keep first 4 and last 4 characters
  scrubbed = scrubbed.replace(PII_PATTERNS.apiKey, (match) => {
    if (match.length > 8) {
      return `${match.substring(0, 4)}***${match.slice(-4)}`;
    }
    return '***';
  });

  // Coordinates - reduce precision to ~100m
  scrubbed = scrubbed.replace(PII_PATTERNS.coordinates, (match) => {
    const [lat, lng] = match.split(',').map(coord => parseFloat(coord.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      // Reduce precision to 2 decimal places (~100m)
      const roundedLat = Math.round(lat * 100) / 100;
      const roundedLng = Math.round(lng * 100) / 100;
      return `${roundedLat}, ${roundedLng}`;
    }
    return '***, ***';
  });

  return scrubbed;
}

// Recursively scrub PII from objects
function scrubObject(obj: any): any {
  if (typeof obj === 'string') {
    return scrubPII(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(scrubObject);
  } else if (obj && typeof obj === 'object') {
    const scrubbed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      scrubbed[key] = scrubObject(value);
    }
    return scrubbed;
  }
  return obj;
}

// Initialize Sentry with PII scrubbing
export function initializeSentry(dsn: string, environment: string = 'production') {
  Sentry.init({
    dsn,
    environment,
    release: Deno.env.get('SENTRY_RELEASE') || '1.0.0',
    dist: Deno.env.get('SENTRY_DIST') || '1',
    
    // PII scrubbing configuration
    beforeSend(event) {
      // Scrub PII from event data
      if (event.message) {
        event.message = scrubPII(event.message);
      }
      
      if (event.exception) {
        event.exception.values?.forEach(exception => {
          if (exception.value) {
            exception.value = scrubPII(exception.value);
          }
        });
      }
      
      if (event.extra) {
        event.extra = scrubObject(event.extra);
      }
      
      if (event.tags) {
        event.tags = scrubObject(event.tags);
      }
      
      if (event.user) {
        event.user = scrubObject(event.user);
      }
      
      if (event.contexts) {
        event.contexts = scrubObject(event.contexts);
      }
      
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
          ...breadcrumb,
          message: breadcrumb.message ? scrubPII(breadcrumb.message) : undefined,
          data: breadcrumb.data ? scrubObject(breadcrumb.data) : undefined,
        }));
      }
      
      return event;
    },
    
    // Deny list for sensitive data
    denyUrls: [
      /.*\/auth\/.*/,
      /.*\/payment.*/,
      /.*\/stripe.*/,
    ],
    
    // Sample rate for performance monitoring
    tracesSampleRate: 0.1,
    
    // Integrations
    integrations: [
      // Add any Deno-specific integrations here
    ],
  });
}

// Privacy filter for breadcrumbs
export function addPrivacyBreadcrumb(message: string, data?: any) {
  Sentry.addBreadcrumb({
    message: scrubPII(message),
    data: data ? scrubObject(data) : undefined,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

// Secure error tracking
export function trackError(error: Error, context?: any) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('errorContext', scrubObject(context));
    }
    scope.setTag('source', 'edge-function');
    Sentry.captureException(error);
  });
}

// Secure message tracking
export function trackMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: any) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('messageContext', scrubObject(context));
    }
    scope.setLevel(level);
    scope.setTag('source', 'edge-function');
    Sentry.captureMessage(scrubPII(message));
  });
}

// Performance monitoring
export function trackPerformance(operation: string, duration: number, context?: any) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('performanceContext', scrubObject(context));
    }
    scope.setTag('operation', operation);
    scope.setTag('source', 'edge-function');
    Sentry.captureMessage(`Performance: ${operation} took ${duration}ms`, 'info');
  });
}

// Security event tracking
export function trackSecurityEvent(event: string, context?: any) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('securityContext', scrubObject(context));
    }
    scope.setLevel('warning');
    scope.setTag('securityEvent', event);
    scope.setTag('source', 'edge-function');
    Sentry.captureMessage(`Security Event: ${event}`, 'warning');
  });
}

// API request/response tracking
export function trackApiRequest(method: string, url: string, context?: any) {
  addPrivacyBreadcrumb(`API Request: ${method} ${url}`, {
    method,
    url: scrubPII(url),
    ...context,
  });
}

export function trackApiResponse(method: string, url: string, status: number, context?: any) {
  const level = status >= 400 ? 'error' : 'info';
  trackMessage(`API Response: ${method} ${url} - ${status}`, level, {
    method,
    url: scrubPII(url),
    status,
    ...context,
  });
}

// User action tracking
export function trackUserAction(action: string, context?: any) {
  addPrivacyBreadcrumb(`User Action: ${action}`, {
    action,
    ...context,
  });
}

// Rate limit tracking
export function trackRateLimit(endpoint: string, user_id?: string, context?: any) {
  trackSecurityEvent('Rate limit exceeded', {
    endpoint,
    user_id: user_id ? scrubPII(user_id) : undefined,
    ...context,
  });
}

// Payment tracking
export function trackPaymentEvent(event: string, context?: any) {
  trackMessage(`Payment Event: ${event}`, 'info', {
    event,
    ...context,
  });
}

// Emergency event tracking
export function trackEmergencyEvent(event: string, context?: any) {
  trackMessage(`Emergency Event: ${event}`, 'warning', {
    event,
    ...context,
  });
}

// Export default configuration
export default {
  initializeSentry,
  addPrivacyBreadcrumb,
  trackError,
  trackMessage,
  trackPerformance,
  trackSecurityEvent,
  trackApiRequest,
  trackApiResponse,
  trackUserAction,
  trackRateLimit,
  trackPaymentEvent,
  trackEmergencyEvent,
};