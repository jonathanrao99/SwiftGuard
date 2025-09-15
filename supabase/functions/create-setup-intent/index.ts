import { serve } from 'https://deno.land/std@0.171.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment validation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const authHeader = 'Basic ' + btoa(STRIPE_SECRET_KEY + ':');

// JWT validation function
async function validateJWT(request: Request): Promise<{ isValid: boolean; userId?: string; error?: string }> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return { isValid: false, error: 'Invalid token' };
    }

    return { isValid: true, userId: user.id };
  } catch (error) {
    return { isValid: false, error: 'Token validation failed' };
  }
}

// Type definitions
interface SetupIntentRequest {
  userId: string;
}

interface SetupIntentResponse {
  clientSecret: string;
}

interface ErrorResponse {
  error: string;
  stack?: string;
}

serve(async (req: Request) => {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate JWT token
    const jwtValidation = await validateJWT(req);
    if (!jwtValidation.isValid) {
      return new Response(JSON.stringify({ error: jwtValidation.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request body
    const body = await req.json() as SetupIntentRequest;
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the userId matches the JWT token
    if (jwtValidation.userId !== userId) {
      return new Response(JSON.stringify({ error: 'User ID mismatch' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch existing Stripe customer ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    if (userError) throw new Error(`Supabase fetch error: ${userError.message}`);

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      // Create new Stripe customer
      const custRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: { 'Authorization': authHeader },
        body: new URLSearchParams({ ['metadata[supabaseUUID]']: userId })
      });
      const custJson = await custRes.json();
      if (!custRes.ok) throw new Error(`Stripe customer create error: ${custJson.error?.message || JSON.stringify(custJson)}`);
      customerId = custJson.id;
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
      if (updateError) throw new Error(`Supabase update error: ${updateError.message}`);
    }

    // Create SetupIntent
    const siRes = await fetch('https://api.stripe.com/v1/setup_intents', {
      method: 'POST',
      headers: { 'Authorization': authHeader },
      body: new URLSearchParams({ customer: customerId })
    });
    const siJson = await siRes.json();
    if (!siRes.ok) throw new Error(`Stripe SetupIntent error: ${siJson.error?.message || JSON.stringify(siJson)}`);

    const response: SetupIntentResponse = { clientSecret: siJson.client_secret };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    // Sanitize error response for production
    const errorMessage = err.message?.includes('Stripe') || err.message?.includes('Supabase') 
      ? 'Setup intent creation error. Please try again.' 
      : err.message || 'Internal server error';
    
    const errorResponse: ErrorResponse = { error: errorMessage };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 