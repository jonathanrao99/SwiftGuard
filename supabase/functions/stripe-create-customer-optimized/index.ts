import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateCustomerRequest {
  email: string
  name: string
  metadata?: Record<string, string>
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
    const body: CreateCustomerRequest = await req.json()
    
    // Validate required fields
    if (!body.email || !body.name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email and name' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create customer using Stripe API
    const stripeResponse = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: body.email,
        name: body.name,
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
        JSON.stringify({ error: 'Failed to create customer', details: errorData }),
        { 
          status: stripeResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const customer = await stripeResponse.json()

    return new Response(
      JSON.stringify({ 
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          created: customer.created
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in stripe-create-customer-optimized:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
