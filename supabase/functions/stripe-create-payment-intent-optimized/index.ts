import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentIntentRequest {
  amount: number
  currency: string
  customer?: string
  description?: string
  metadata?: Record<string, string>
  automatic_payment_methods?: {
    enabled: boolean
    allow_redirects?: string
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Stripe secret key from environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured')
    }

    // Parse request body
    const body: PaymentIntentRequest = await req.json()
    
    // Validate required fields
    if (!body.amount || !body.currency) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount and currency' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create payment intent using Stripe API
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: body.amount.toString(),
        currency: body.currency,
        ...(body.customer && { customer: body.customer }),
        ...(body.description && { description: body.description }),
        ...(body.automatic_payment_methods?.enabled && { 
          'automatic_payment_methods[enabled]': 'true',
          ...(body.automatic_payment_methods.allow_redirects && {
            'automatic_payment_methods[allow_redirects]': body.automatic_payment_methods.allow_redirects
          })
        }),
        // Add metadata
        ...Object.fromEntries(
          Object.entries(body.metadata || {}).map(([key, value]) => [`metadata[${key}]`, value])
        ),
      }),
    })

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json()
      console.error('Stripe API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment intent', details: errorData }),
        { 
          status: stripeResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const paymentIntent = await stripeResponse.json()

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log payment intent creation
    const { error: logError } = await supabase
      .from('payment_transactions')
      .insert({
        stripe_payment_intent_id: paymentIntent.id,
        amount: body.amount / 100, // Convert back to dollars for logging
        currency: body.currency,
        status: 'created',
        description: body.description || 'SwiftGuard job payment',
        metadata: body.metadata,
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging payment intent:', logError)
      // Don't fail the request for logging errors
    }

    return new Response(
      JSON.stringify({ 
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in stripe-create-payment-intent-optimized:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
