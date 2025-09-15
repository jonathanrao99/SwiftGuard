import { supabase } from '../supabaseClient';
import { AppUser, Job, PaymentIntent, PaymentMethod } from '../types';

export interface CreatePaymentIntentParams {
  jobId: string;
  amount: number;
  currency: string;
  clientId: string;
  guardId: string;
  description: string;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  created: number;
  client_secret?: string;
  payment_method?: string;
  error?: string;
}

export interface EscrowStatus {
  jobId: string;
  amount: number;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
  clientId: string;
  guardId: string;
  createdAt: string;
  releasedAt?: string;
  disputeReason?: string;
}

class PaymentService {
  private static instance: PaymentService;

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Create a payment intent for a job
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<{ success: boolean; data?: PaymentStatus; error?: string }> {
    try {
      const response = await supabase.functions.invoke('create-payment-intent', {
        body: {
          jobId: params.jobId,
          amount: params.amount,
          currency: params.currency,
          clientId: params.clientId,
          guardId: params.guardId,
          description: params.description,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create payment intent');
      }

      // Update job with payment intent ID
      await this.updateJobPaymentIntent(params.jobId, response.data.id);

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Confirm payment and hold funds in escrow
   */
  async confirmPayment(paymentIntentId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update payment status in database
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) throw error;

      // Create escrow record
      const { error: escrowError } = await supabase
        .from('escrow')
        .insert({
          job_id: jobId,
          payment_intent_id: paymentIntentId,
          status: 'held',
          created_at: new Date().toISOString()
        });

      if (escrowError) throw escrowError;

      // Update job status
      await this.updateJobPaymentStatus(jobId, 'paid');

      return { success: true };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Release escrow funds to guard upon job completion
   */
  async releaseEscrow(jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get escrow details
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (escrowError || !escrow) {
        throw new Error('Escrow record not found');
      }

      // Update escrow status
      const { error: updateError } = await supabase
        .from('escrow')
        .update({ 
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', escrow.id);

      if (updateError) throw updateError;

      // Create payout record for guard
      const { error: payoutError } = await supabase
        .from('guard_payouts')
        .insert({
          job_id: jobId,
          guard_id: escrow.guard_id,
          amount: escrow.amount,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (payoutError) throw payoutError;

      // Update job status
      await this.updateJobPaymentStatus(jobId, 'completed');

      return { success: true };
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Handle payment disputes
   */
  async handleDispute(jobId: string, reason: string, evidence?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update escrow status to disputed
      const { error: escrowError } = await supabase
        .from('escrow')
        .update({ 
          status: 'disputed',
          dispute_reason: reason,
          dispute_evidence: evidence,
          disputed_at: new Date().toISOString()
        })
        .eq('job_id', jobId);

      if (escrowError) throw escrowError;

      // Create dispute record
      const { error: disputeError } = await supabase
        .from('payment_disputes')
        .insert({
          job_id: jobId,
          reason,
          evidence,
          status: 'open',
          created_at: new Date().toISOString()
        });

      if (disputeError) throw disputeError;

      return { success: true };
    } catch (error) {
      console.error('Error handling dispute:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string, userType: 'client' | 'guard'): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          jobs (
            title,
            description,
            location,
            start_date,
            end_date
          )
        `);

      if (userType === 'client') {
        query = query.eq('client_id', userId);
      } else {
        query = query.eq('guard_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get escrow status for a job
   */
  async getEscrowStatus(jobId: string): Promise<{ success: boolean; data?: EscrowStatus; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('escrow')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching escrow status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Calculate fees for a payment amount
   */
  calculateFees(amount: number): { platformFee: number; stripeFee: number; total: number } {
    const platformFee = amount * 0.05; // 5% platform fee
    const stripeFee = amount * 0.029 + 0.30; // 2.9% + $0.30 Stripe fee
    const total = amount + platformFee + stripeFee;
    
    return { platformFee, stripeFee, total };
  }

  /**
   * Update job with payment intent ID
   */
  private async updateJobPaymentIntent(jobId: string, paymentIntentId: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .update({ 
        payment_intent_id: paymentIntentId,
        payment_status: 'pending'
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job payment intent:', error);
    }
  }

  /**
   * Update job payment status
   */
  private async updateJobPaymentStatus(jobId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .update({ payment_status: status })
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job payment status:', error);
    }
  }
}

export default PaymentService.getInstance();

