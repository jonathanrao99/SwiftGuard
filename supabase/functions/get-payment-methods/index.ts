import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// TypeScript interfaces
interface PaymentMethodRequest {
  customerId?: string;
  userId?: string;
}

interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req: Request) => {
  try {
    const { customerId, userId }: PaymentMethodRequest = await req.json();
    
    let stripeCustomerId = customerId;
    
    // If userId provided, get customer ID from database
    if (userId && !customerId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();
      
      stripeCustomerId = user?.stripe_customer_id;
    }
    
    if (!stripeCustomerId) {
      return new Response(
        JSON.stringify({
          paymentMethods: [],
          success: true,
          message: 'No customer ID found'
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
    }

    // Get Stripe API key
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    // Fetch payment methods from Stripe
    const response = await fetch(
      `https://api.stripe.com/v1/payment_methods?customer=${stripeCustomerId}&type=card`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.statusText}`);
    }

    const stripeData = await response.json();
    
    // Transform Stripe data to our format
    const paymentMethods = stripeData.data.map((pm: StripePaymentMethod) => ({
      id: pm.id,
      type: pm.type,
      name: `${pm.card?.brand?.charAt(0).toUpperCase()}${pm.card?.brand?.slice(1)} ending in ${pm.card?.last4}`,
      last4: pm.card?.last4,
      brand: pm.card?.brand,
      isDefault: false, // You can implement default logic later
      expiryDate: `${pm.card?.exp_month?.toString().padStart(2, '0')}/${pm.card?.exp_year?.toString().slice(-2)}`,
    }));

    return new Response(
      JSON.stringify({
        paymentMethods,
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
    
  } catch (error: any) {
    console.error('Get payment methods error:', error);
    
    return new Response(
      JSON.stringify({
        paymentMethods: [],
        success: false,
        error: error.message
      }),
      {
        status: 400,
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