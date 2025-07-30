import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(async (req: Request) => {
  try {
    const { customerId, paymentMethodData } = await req.json();
    
    // In a real implementation, you would use Stripe SDK to create payment method
    // For now, return a mock successful response
    const mockPaymentMethod = {
      id: `pm_${Date.now()}`,
      object: 'payment_method',
      billing_details: {
        address: null,
        email: paymentMethodData.email || 'admin@swiftguard.com',
        name: paymentMethodData.cardholderName || 'Admin User',
        phone: null
      },
      card: {
        brand: paymentMethodData.brand || 'visa',
        country: 'US',
        exp_month: parseInt(paymentMethodData.expiryDate?.split('/')[0]) || 12,
        exp_year: 2000 + parseInt(paymentMethodData.expiryDate?.split('/')[1]) || 2025,
        fingerprint: `test_fingerprint_${Date.now()}`,
        funding: 'credit',
        generated_from: null,
        last4: paymentMethodData.last4 || '4242',
        networks: {
          available: [paymentMethodData.brand || 'visa'],
          preferred: null
        },
        three_d_secure_usage: {
          supported: true
        },
        wallet: null
      },
      created: Date.now() / 1000,
      customer: customerId || 'cus_SlusInVaUZRN6K',
      livemode: false,
      metadata: {},
      type: 'card'
    };

    return new Response(
      JSON.stringify({
        paymentMethod: mockPaymentMethod,
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
    console.error('Error in stripe-add-payment-method:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to add payment method',
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