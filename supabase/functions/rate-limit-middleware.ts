// Rate limiting middleware for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  endpoint: string;
}

interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  maxRequests: number;
  retryAfter?: number;
  error?: string;
}

// Default rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth': { maxRequests: 10, windowMinutes: 15, endpoint: 'auth' },
  'payment': { maxRequests: 20, windowMinutes: 60, endpoint: 'payment' },
  'api': { maxRequests: 100, windowMinutes: 60, endpoint: 'api' },
  'default': { maxRequests: 50, windowMinutes: 60, endpoint: 'default' }
};

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.default
): Promise<RateLimitResult> {
  try {
    // Extract user ID from JWT token if available
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        userId = user?.id || null;
      } catch (error) {
        // Token might be invalid, continue without user ID
        console.warn('Failed to extract user from token:', error);
      }
    }
    
    // Extract IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Call rate limiting function
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_user_id: userId,
      p_ip_address: ipAddress,
      p_endpoint: config.endpoint,
      p_max_requests: config.maxRequests,
      p_window_minutes: config.windowMinutes
    });
    
    if (error) {
      console.error('Rate limit check failed:', error);
      return {
        allowed: true, // Fail open for now
        currentCount: 0,
        maxRequests: config.maxRequests,
        error: error.message
      };
    }
    
    return {
      allowed: data.allowed,
      currentCount: data.current_count,
      maxRequests: data.max_requests,
      retryAfter: data.retry_after
    };
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    return {
      allowed: true, // Fail open
      currentCount: 0,
      maxRequests: config.maxRequests,
      error: error.message
    };
  }
}

/**
 * Rate limiting middleware wrapper
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  config?: RateLimitConfig
) {
  return async (req: Request): Promise<Response> => {
    const rateLimitResult = await checkRateLimit(req, config);
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, rateLimitResult.maxRequests - rateLimitResult.currentCount).toString(),
            'X-RateLimit-Reset': new Date(Date.now() + (rateLimitResult.retryAfter || 60) * 1000).toISOString()
          }
        }
      );
    }
    
    // Add rate limit headers to successful responses
    const response = await handler(req);
    
    // Clone response to add headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-RateLimit-Limit': rateLimitResult.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, rateLimitResult.maxRequests - rateLimitResult.currentCount).toString()
      }
    });
    
    return newResponse;
  };
}

/**
 * Get rate limit config for specific endpoint
 */
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  return RATE_LIMITS[endpoint] || RATE_LIMITS.default;
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  retryAfter: number,
  maxRequests: number,
  currentCount: number
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter,
      limit: maxRequests,
      current: currentCount
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString()
      }
    }
  );
}

