import { serve } from 'https://deno.land/std@0.171.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// TypeScript interfaces for request/response
interface SetupIntentRequest {
  userId: string;
}

interface StripeCustomer {
  id: string;
  metadata?: {
    supabaseUUID?: string;
  };
}

interface StripeSetupIntent {
  id: string;
  client_secret: string;
}

interface UserRecord {
  stripe_customer_id: string | null;
}

// Log critical env variables on startup
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
    const { userId }: SetupIntentRequest = await req.json();
    console.log('Invoked with userId:', userId);

    // Fetch existing Stripe customer ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single() as { data: UserRecord | null; error: any };
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
      const custJson: StripeCustomer = await custRes.json();
      if (!custRes.ok) throw new Error(`Stripe customer create error: ${custJson.error?.message || JSON.stringify(custJson)}`);
      customerId = custJson.id;
      console.log('Created Stripe customer:', customerId);
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
      if (updateError) throw new Error(`Supabase update error: ${updateError.message}`);
    }

    console.log('Creating SetupIntent for customer:', customerId);
    // POST https://api.stripe.com/v1/setup_intents
    const siRes = await fetch('https://api.stripe.com/v1/setup_intents', {
      method: 'POST',
      headers: { 'Authorization': authHeader },
      body: new URLSearchParams({ customer: customerId })
    });
    const siJson: StripeSetupIntent = await siRes.json();
    if (!siRes.ok) throw new Error(`Stripe SetupIntent error: ${siJson.error?.message || JSON.stringify(siJson)}`);
    console.log('SetupIntent created:', siJson.id);

    return new Response(JSON.stringify({ clientSecret: siJson.client_secret }), {
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