import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(async (req: Request) => {
  const mockPaymentMethods = [
    {
      id: 'pm_1RqN2s2eZvKYlo2CqtXFJnvI',
      object: 'payment_method',
      billing_details: {
        address: null,
        email: 'admin@swiftguard.com',
        name: 'Admin User',
        phone: null
      },
      card: {
        brand: 'visa',
        country: 'US',
        exp_month: 12,
        exp_year: 2025,
        fingerprint: 'test_fingerprint',
        funding: 'credit',
        generated_from: null,
        last4: '4242',
        networks: {
          available: ['visa'],
          preferred: null
        },
        three_d_secure_usage: {
          supported: true
        },
        wallet: null
      },
      created: 1753832096,
      customer: 'cus_SlusInVaUZRN6K',
      livemode: false,
      metadata: {},
      type: 'card'
    },
    {
      id: 'pm_1RqN2s2eZvKYlo2CqtXFJnvJ',
      object: 'payment_method',
      billing_details: {
        address: null,
        email: 'admin@swiftguard.com',
        name: 'Admin User',
        phone: null
      },
      card: {
        brand: 'mastercard',
        country: 'US',
        exp_month: 8,
        exp_year: 2026,
        fingerprint: 'test_fingerprint_2',
        funding: 'credit',
        generated_from: null,
        last4: '5555',
        networks: {
          available: ['mastercard'],
          preferred: null
        },
        three_d_secure_usage: {
          supported: true
        },
        wallet: null
      },
      created: 1753832097,
      customer: 'cus_SlusInVaUZRN6K',
      livemode: false,
      metadata: {},
      type: 'card'
    }
  ];

  return new Response(
    JSON.stringify({
      paymentMethods: mockPaymentMethods,
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
}); 