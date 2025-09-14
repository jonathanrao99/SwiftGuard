import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(async (req: Request) => {
  const mockPaymentMethods = [
    {
      id: 'pm_1',
      type: 'card',
      name: 'Visa ending in 4242',
      last4: '4242',
      brand: 'visa',
      isDefault: true,
      expiryDate: '12/25',
    },
    {
      id: 'pm_2',
      type: 'card',
      name: 'Mastercard ending in 5555',
      last4: '5555',
      brand: 'mastercard',
      isDefault: false,
      expiryDate: '08/26',
    },
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