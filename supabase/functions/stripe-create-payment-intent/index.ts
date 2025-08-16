import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Environment validation
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

Deno.serve(async (req: Request) => {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { amount, currency = 'usd', customerId, jobId, description } = await req.json();
    
    // Input validation
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Valid amount is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (amount > 5000000) { // Max $50,000
      return new Response(JSON.stringify({ error: 'Amount exceeds maximum limit' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create payment intent with Stripe API
    const paymentIntentData = {
      amount: Math.round(amount), // Ensure integer
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        jobId: jobId || '',
        source: 'swiftguard_app'
      }
    };

    // Add customer if provided
    if (customerId) {
      paymentIntentData.customer = customerId;
    }

    // Add description if provided
    if (description) {
      paymentIntentData.description = description;
    }

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(paymentIntentData as any).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Stripe API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const paymentIntent = await response.json();

    return new Response(
      JSON.stringify({
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        },
        success: true
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  } catch (error) {
    console.error('Error in stripe-create-payment-intent:', error);
    
    // Sanitize error for production
    const errorMessage = error.message?.includes('Stripe') 
      ? 'Payment processing error. Please try again.' 
      : 'Failed to create payment intent';
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: 'PAYMENT_INTENT_ERROR'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}); 