/**
 * SwiftGuard Privacy Request Edge Function
 * Handles data subject requests (DSR) for GDPR/CCPA compliance
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { initializeSentry, trackError, trackMessage } from '../sentry-config.ts';

// Initialize Sentry
const SENTRY_DSN = Deno.env.get('SENTRY_DSN');
if (SENTRY_DSN) {
  initializeSentry(SENTRY_DSN, 'production');
}

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Request types
interface PrivacyRequest {
  action: 'export_my_data' | 'delete_my_data' | 'rectify_my_data' | 'restrict_processing';
  user_id: string;
  reason?: string;
  specific_data?: string[];
  contact_method?: 'email' | 'phone';
  urgency?: 'low' | 'medium' | 'high';
}

interface DataExport {
  user_id: string;
  export_data: {
    profile: any;
    jobs: any[];
    payments: any[];
    ratings: any[];
    emergency_contacts: any[];
    analytics_events: any[];
  };
  generated_at: string;
  expires_at: string;
}

// Rate limiting check
async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      user_id: userId,
      endpoint: 'privacy-request',
      max_requests: 5,
      window_minutes: 60
    });

    if (error) {
      trackError(new Error(`Rate limit check failed: ${error.message}`), { userId, endpoint: 'privacy-request' });
      return false;
    }

    return data;
  } catch (error) {
    trackError(error as Error, { userId, endpoint: 'privacy-request' });
    return false;
  }
}

// Validate request
function validateRequest(request: PrivacyRequest): string[] {
  const errors: string[] = [];

  if (!request.action) {
    errors.push('Action is required');
  }

  if (!['export_my_data', 'delete_my_data', 'rectify_my_data', 'restrict_processing'].includes(request.action)) {
    errors.push('Invalid action. Must be one of: export_my_data, delete_my_data, rectify_my_data, restrict_processing');
  }

  if (!request.user_id) {
    errors.push('User ID is required');
  }

  if (request.urgency && !['low', 'medium', 'high'].includes(request.urgency)) {
    errors.push('Invalid urgency. Must be one of: low, medium, high');
  }

  if (request.contact_method && !['email', 'phone'].includes(request.contact_method)) {
    errors.push('Invalid contact method. Must be one of: email, phone');
  }

  return errors;
}

// Export user data
async function exportUserData(userId: string): Promise<DataExport> {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    // Get user jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('client_id', userId);

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    // Get user payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId);

    if (paymentsError) {
      throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
    }

    // Get user ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from('guard_ratings')
      .select('*')
      .eq('rater_id', userId);

    if (ratingsError) {
      throw new Error(`Failed to fetch ratings: ${ratingsError.message}`);
    }

    // Get emergency contacts
    const { data: emergencyContacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId);

    if (contactsError) {
      throw new Error(`Failed to fetch emergency contacts: ${contactsError.message}`);
    }

    // Get analytics events (anonymized)
    const { data: analyticsEvents, error: analyticsError } = await supabase
      .from('analytics_events')
      .select('event_name, props, ts')
      .eq('user_id', userId)
      .order('ts', { ascending: false })
      .limit(1000);

    if (analyticsError) {
      throw new Error(`Failed to fetch analytics events: ${analyticsError.message}`);
    }

    const exportData: DataExport = {
      user_id: userId,
      export_data: {
        profile,
        jobs: jobs || [],
        payments: payments || [],
        ratings: ratings || [],
        emergency_contacts: emergencyContacts || [],
        analytics_events: analyticsEvents || [],
      },
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    return exportData;
  } catch (error) {
    trackError(error as Error, { userId, action: 'export_data' });
    throw error;
  }
}

// Delete user data
async function deleteUserData(userId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  try {
    // Add to deletion queue for soft delete first
    const { error: queueError } = await supabase.rpc('add_to_deletion_queue', {
      p_table_name: 'users',
      p_record_id: userId,
      p_user_id: userId,
      p_deletion_type: 'soft',
      p_delay_days: 30 // 30-day grace period
    });

    if (queueError) {
      throw new Error(`Failed to add to deletion queue: ${queueError.message}`);
    }

    // Log the deletion request
    const { error: logError } = await supabase
      .from('privacy_requests')
      .insert({
        user_id: userId,
        action: 'delete_my_data',
        status: 'pending',
        reason,
        requested_at: new Date().toISOString(),
        grace_period_ends: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (logError) {
      trackError(new Error(`Failed to log deletion request: ${logError.message}`), { userId });
    }

    return {
      success: true,
      message: 'Data deletion request submitted. You have 30 days to reconsider. After this period, your data will be permanently deleted.'
    };
  } catch (error) {
    trackError(error as Error, { userId, action: 'delete_data' });
    throw error;
  }
}

// Rectify user data
async function rectifyUserData(userId: string, specificData?: string[]): Promise<{ success: boolean; message: string }> {
  try {
    // Log the rectification request
    const { error: logError } = await supabase
      .from('privacy_requests')
      .insert({
        user_id: userId,
        action: 'rectify_my_data',
        status: 'pending',
        specific_data: specificData,
        requested_at: new Date().toISOString()
      });

    if (logError) {
      throw new Error(`Failed to log rectification request: ${logError.message}`);
    }

    return {
      success: true,
      message: 'Data rectification request submitted. Our team will review and update your data within 7 days.'
    };
  } catch (error) {
    trackError(error as Error, { userId, action: 'rectify_data' });
    throw error;
  }
}

// Restrict processing
async function restrictProcessing(userId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  try {
    // Update user processing flags
    const { error: updateError } = await supabase
      .from('users')
      .update({
        processing_restricted: true,
        processing_restriction_reason: reason,
        processing_restricted_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to restrict processing: ${updateError.message}`);
    }

    // Log the restriction request
    const { error: logError } = await supabase
      .from('privacy_requests')
      .insert({
        user_id: userId,
        action: 'restrict_processing',
        status: 'completed',
        reason,
        requested_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    if (logError) {
      trackError(new Error(`Failed to log restriction request: ${logError.message}`), { userId });
    }

    return {
      success: true,
      message: 'Data processing has been restricted. Your data will only be used for essential service delivery.'
    };
  } catch (error) {
    trackError(error as Error, { userId, action: 'restrict_processing' });
    throw error;
  }
}

// Main handler
serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const request: PrivacyRequest = await req.json();

    // Validate request
    const validationErrors = validateRequest(request);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting
    const rateLimitOk = await checkRateLimit(request.user_id);
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process request based on action
    let result: any;

    switch (request.action) {
      case 'export_my_data':
        const exportData = await exportUserData(request.user_id);
        result = {
          success: true,
          data: exportData,
          message: 'Data export generated successfully. Download link will be sent to your registered email.'
        };
        break;

      case 'delete_my_data':
        result = await deleteUserData(request.user_id, request.reason);
        break;

      case 'rectify_my_data':
        result = await rectifyUserData(request.user_id, request.specific_data);
        break;

      case 'restrict_processing':
        result = await restrictProcessing(request.user_id, request.reason);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Log successful request
    trackMessage(`Privacy request processed: ${request.action}`, 'info', {
      userId: request.user_id,
      action: request.action,
      urgency: request.urgency
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    trackError(error as Error, { endpoint: 'privacy-request' });

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.'
      }),
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});





