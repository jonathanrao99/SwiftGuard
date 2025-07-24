// @ts-nocheck

import { serve } from 'https://deno.land/std@0.171.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log('Edge Function ENV:', {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL')?.slice(0,30) + '...',  
  HAS_SERVICE_ROLE: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  HAS_STRIPE_KEY: !!Deno.env.get('STRIPE_SECRET_KEY')
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
const authHeader = 'Basic ' + btoa(stripeKey + ':');

serve(async (req: Request) => {
  try {
    const { userId, amount, jobDetails } = await req.json();
    console.log('Creating payment intent for job:', { userId, amount, jobDetails });

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
    console.error('Function caught error:', err.stack || err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 