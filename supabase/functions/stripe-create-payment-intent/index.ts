import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(async (req: Request) => {
  try {
    const { amount, currency, customerId, paymentMethodId, jobId } = await req.json();
    
    // In a real implementation, you would use Stripe SDK to create payment intent
    // For now, return a mock successful response
    const mockPaymentIntent = {
      id: `pi_${Date.now()}`,
      object: 'payment_intent',
      amount: amount || 2500, // $25.00 in cents
      currency: currency || 'usd',
      customer: customerId || 'cus_SlusInVaUZRN6K',
      payment_method: paymentMethodId || 'pm_1RqN2s2eZvKYlo2CqtXFJnvI',
      status: 'requires_confirmation',
      created: Date.now() / 1000,
      livemode: false,
      metadata: {
        jobId: jobId || 'job_123'
      },
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
    };

    return new Response(
      JSON.stringify({
        paymentIntent: mockPaymentIntent,
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
    
    return new Response(
      JSON.stringify({
        error: 'Failed to create payment intent',
        details: error.message
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