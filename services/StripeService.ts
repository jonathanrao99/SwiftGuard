import { supabase } from '../supabaseClient';

export interface PaymentData {
  jobId: string;
  clientId: string;
  amount: number;
  currency: string;
  description: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  stripeCustomerId?: string;
}

class StripeService {
  /**
   * Create or retrieve a Stripe customer using Stripe MCP
   */
  static async createOrRetrieveCustomer(userData: StripeCustomer): Promise<string | null> {
    try {
      // Check if user already has a Stripe customer ID
      if (userData.stripeCustomerId) {
        return userData.stripeCustomerId;
      }

      // Create a new Stripe customer using Stripe MCP
      // This would be called via the Stripe edge function
      const response = await supabase.functions.invoke('create-stripe-customer', {
        body: {
          email: userData.email,
          name: userData.name,
          metadata: {
            userId: userData.id,
            platform: 'swiftguard-mobile'
          }
        }
      });

      if (response.error) {
        console.error('Error creating Stripe customer:', response.error);
        return null;
      }

      const { customer } = response.data;
      
      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userData.id);

      return customer.id;
    } catch (error) {
      console.error('Error in createOrRetrieveCustomer:', error);
      return null;
    }
  }

  /**
   * Create a payment intent for job payment using optimized Stripe integration
   */
  static async createPaymentIntent(paymentData: PaymentData): Promise<{ 
    clientSecret: string | null; 
    paymentIntentId: string | null; 
  }> {
    try {
      // Get client information for Stripe customer creation
      const { data: client, error: clientError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, stripe_customer_id')
        .eq('id', paymentData.clientId)
        .single();

      if (clientError || !client) {
        console.error('Error fetching client:', clientError);
        return { clientSecret: null, paymentIntentId: null };
      }

      // Create or retrieve Stripe customer
      const customerId = await this.createOrRetrieveCustomer({
        id: client.id,
        email: client.email,
        name: `${client.first_name} ${client.last_name}`,
        stripeCustomerId: client.stripe_customer_id
      });

      if (!customerId) {
        console.error('Failed to create or retrieve Stripe customer');
        return { clientSecret: null, paymentIntentId: null };
      }

      // Create payment intent via Stripe edge function with MCP optimization
      const response = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(paymentData.amount * 100), // Convert to cents
          currency: paymentData.currency.toLowerCase(),
          customer: customerId,
          description: paymentData.description,
          metadata: {
            jobId: paymentData.jobId,
            clientId: paymentData.clientId,
            platform: 'swiftguard-mobile'
          },
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never' // Better for mobile apps
          }
        }
      });

      if (response.error) {
        console.error('Error creating payment intent:', response.error);
        return { clientSecret: null, paymentIntentId: null };
      }

      const { paymentIntent } = response.data;

      // Update job with payment intent ID
      await supabase
        .from('jobs')
        .update({ 
          payment_intent_id: paymentIntent.id,
          status: 'pending_payment'
        })
        .eq('id', paymentData.jobId);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Error in createPaymentIntent:', error);
      return { clientSecret: null, paymentIntentId: null };
    }
  }

  /**
   * Confirm payment and update job status
   */
  static async confirmPayment(paymentIntentId: string, jobId: string): Promise<boolean> {
    try {
      // Update job status after successful payment
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('payment_intent_id', paymentIntentId);

      if (error) {
        console.error('Error updating job after payment:', error);
        return false;
      }

      // Create payment transaction record
      await supabase
        .from('payment_transactions')
        .insert({
          job_id: jobId,
          stripe_payment_intent_id: paymentIntentId,
          status: 'completed',
          payment_method: 'stripe'
        });

      return true;
    } catch (error) {
      console.error('Error in confirmPayment:', error);
      return false;
    }
  }

  /**
   * Handle failed payment
   */
  static async handleFailedPayment(paymentIntentId: string, jobId: string): Promise<void> {
    try {
      // Update job status for failed payment
      await supabase
        .from('jobs')
        .update({ 
          status: 'payment_failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('payment_intent_id', paymentIntentId);

      // Create failed payment transaction record
      await supabase
        .from('payment_transactions')
        .insert({
          job_id: jobId,
          stripe_payment_intent_id: paymentIntentId,
          status: 'failed',
          payment_method: 'stripe'
        });
    } catch (error) {
      console.error('Error in handleFailedPayment:', error);
    }
  }

  /**
   * Get payment methods for a customer using Stripe MCP
   */
  static async getCustomerPaymentMethods(customerId: string): Promise<any[]> {
    try {
      const response = await supabase.functions.invoke('get-payment-methods', {
        body: { customer: customerId }
      });

      if (response.error) {
        console.error('Error fetching payment methods:', response.error);
        return [];
      }

      return response.data.paymentMethods || [];
    } catch (error) {
      console.error('Error in getCustomerPaymentMethods:', error);
      return [];
    }
  }

  /**
   * Setup future payments for a customer
   */
  static async setupFuturePayments(customerId: string): Promise<{ 
    clientSecret: string | null; 
    setupIntentId: string | null; 
  }> {
    try {
      const response = await supabase.functions.invoke('create-setup-intent', {
        body: {
          customer: customerId,
          payment_method_types: ['card'],
          usage: 'off_session'
        }
      });

      if (response.error) {
        console.error('Error creating setup intent:', response.error);
        return { clientSecret: null, setupIntentId: null };
      }

      const { setupIntent } = response.data;

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id
      };
    } catch (error) {
      console.error('Error in setupFuturePayments:', error);
      return { clientSecret: null, setupIntentId: null };
    }
  }
}

export default StripeService;
