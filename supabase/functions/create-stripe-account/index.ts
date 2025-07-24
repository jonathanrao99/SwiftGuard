
import { serve } from 'https://deno.land/std@0.171.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
const authHeader = 'Basic ' + btoa(stripeKey + ':');

serve(async (req: Request) => {
  try {
    const { userId } = await req.json();
    console.log('Creating Stripe Connect account for user:', userId);

    // Check if user already has a Stripe account ID
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (profileError) throw new Error(`Supabase profile fetch error: ${profileError.message}`);

    let accountId = userProfile.stripe_account_id;

    if (!accountId) {
      // Create a new Stripe Connect account (Express)
      const accountRes = await fetch('https://api.stripe.com/v1/accounts', {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          type: 'express',
          country: 'US', // Or dynamically determine based on user
          'capabilities[card_payments][requested]': 'true',
          'capabilities[transfers][requested]': 'true',
          'metadata[supabaseUUID]': userId,
        }),
      });
      const accountJson = await accountRes.json();
      if (!accountRes.ok) throw new Error(`Stripe account create error: ${accountJson.error?.message || JSON.stringify(accountJson)}`);
      accountId = accountJson.id;

      // Save the account ID to the user's profile in Supabase
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ stripe_account_id: accountId })
        .eq('id', userId);
      if (updateError) throw new Error(`Supabase update error: ${updateError.message}`);
    }

    // Create an account link for onboarding
    const accountLinkRes = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        account: accountId,
        refresh_url: 'https://example.com/reauth', // Replace with your app's reauth URL
        return_url: 'https://example.com/return', // Replace with your app's return URL
        type: 'account_onboarding',
      }),
    });
    const accountLinkJson = await accountLinkRes.json();
    if (!accountLinkRes.ok) throw new Error(`Stripe account link error: ${accountLinkJson.error?.message || JSON.stringify(accountLinkJson)}`);

    return new Response(JSON.stringify({ url: accountLinkJson.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Function caught error:', err.stack || err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
