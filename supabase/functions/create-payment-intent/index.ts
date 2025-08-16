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

// Input validation schema
interface PaymentRequest {
  userId: string;
  amount: number;
  jobDetails: {
    id: string;
    title: string;
    location: string;
  };
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

    // Parse and validate request body
    const body = await req.json() as PaymentRequest;
    const { userId, amount, jobDetails } = body;

    // Input validation
    if (!userId || !amount || !jobDetails?.id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (amount <= 0 || amount > 50000) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
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
      console.log('No existing customer, creating new...');
      // POST https://api.stripe.com/v1/customers
      const custRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: { 'Authorization': authHeader },
        body: new URLSearchParams({ ['metadata[supabaseUUID]']: userId })
      });
      const custJson = await custRes.json();
      if (!custRes.ok) throw new Error(`Stripe customer create error: ${custJson.error?.message || JSON.stringify(custJson)}`);
      customerId = custJson.id;
      console.log('Created Stripe customer:', customerId);
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
      if (updateError) throw new Error(`Supabase update error: ${updateError.message}`);
    }

    // Create a payment intent
    const piRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: { 'Authorization': authHeader },
      body: new URLSearchParams({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: customerId,
        payment_method_types: 'card',
        metadata: {
          jobId: jobDetails.id,
          jobTitle: jobDetails.title,
          jobLocation: jobDetails.location
        }
      })
    });
    const piJson = await piRes.json();
    if (!piRes.ok) throw new Error(`Stripe PaymentIntent error: ${piJson.error?.message || JSON.stringify(piJson)}`);
    console.log('PaymentIntent created:', piJson.id);

    return new Response(JSON.stringify({ 
      clientSecret: piJson.client_secret,
      paymentIntentId: piJson.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Payment intent creation failed:', err.message);
    
    // Sanitize error response for production
    const errorMessage = err.message?.includes('Stripe') || err.message?.includes('Supabase') 
      ? 'Payment processing error. Please try again.' 
      : err.message || 'Internal server error';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      code: 'PAYMENT_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 