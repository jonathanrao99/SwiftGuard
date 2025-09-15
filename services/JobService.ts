import { supabase } from '../supabaseClient';
import { Job } from '../types';

export interface JobData {
  title: string;
  description: string;
  location: string;
  pay: number;
  start_time: string;
  end_time: string;
  num_guards: number;
  client_id: string;
}

// REMOVED: Duplicate Job interface - use the one from types/index.ts instead

export interface JobGuard {
  id: string;
  job_id: string;
  guard_id: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_at: string;
}

export class JobService {
  // Create a new job
  static async createJob(jobData: JobData): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()
        .single();

      if (error) {
        // Log error through proper logging service
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating job:', error);
      return null;
    }
  }

  // Get all available jobs for guards
  static async getAvailableJobs(): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          users!jobs_client_id_fkey (
            first_name,
            last_name,
            business_name,
            phone,
            email
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching available jobs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching available jobs:', error);
      return [];
    }
  }

  // Get jobs for a specific client
  static async getClientJobs(clientId: string): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_guards (
            *,
            users!job_guards_guard_id_fkey (
              first_name,
              last_name,
              phone,
              email
            )
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client jobs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching client jobs:', error);
      return [];
    }
  }

  // Get jobs for a specific guard
  static async getGuardJobs(guardId: string): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('job_guards')
        .select(`
          *,
          jobs!job_guards_job_id_fkey (
            *,
            users!jobs_client_id_fkey (
              first_name,
              last_name,
              business_name,
              phone,
              email
            )
          )
        `)
        .eq('guard_id', guardId)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching guard jobs:', error);
        return [];
      }

      return data?.map(jobGuard => jobGuard.jobs).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching guard jobs:', error);
      return [];
    }
  }

  // Accept a job (guard accepts a job)
  static async acceptJob(jobId: string, guardId: string): Promise<boolean> {
    try {
      // First, check if the job is still available
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'open')
        .single();

      if (jobError || !job) {
        console.error('Job not available:', jobError);
        return false;
      }

      // Create job_guard relationship
      const { error: jobGuardError } = await supabase
        .from('job_guards')
        .insert([{
          job_id: jobId,
          guard_id: guardId,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        }]);

      if (jobGuardError) {
        console.error('Error creating job_guard relationship:', jobGuardError);
        return false;
      }

      // Update job status to assigned
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'assigned' })
        .eq('id', jobId);

      if (updateError) {
        console.error('Error updating job status:', updateError);
        return false;
      }

      // Send notification to client
      await this.sendJobAcceptedNotification(jobId, guardId);

      return true;
    } catch (error) {
      console.error('Error accepting job:', error);
      return false;
    }
  }

  // Send notification when job is accepted
  static async sendJobAcceptedNotification(jobId: string, guardId: string): Promise<void> {
    try {
      // Get job and client details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          users!jobs_client_id_fkey (
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        console.error('Error fetching job for notification:', jobError);
        return;
      }

      // Get guard details
      const { data: guard, error: guardError } = await supabase
        .from('users')
        .select('first_name, last_name, phone, email')
        .eq('id', guardId)
        .single();

      if (guardError || !guard) {
        console.error('Error fetching guard for notification:', guardError);
        return;
      }

      // Create notification record
      await supabase
        .from('notifications')
        .insert([{
          user_id: job.client_id,
          title: 'Job Accepted',
          message: `${guard.first_name} ${guard.last_name} has accepted your job: ${job.title}`,
          type: 'job_assigned',
          data: {
            job_id: jobId,
            guard_id: guardId,
            job_title: job.title
          }
        }]);

      // Send SMS notification (via Edge Function)
      await supabase.functions.invoke('send-sms-notification', {
        body: {
          to: job.users.phone,
          message: `Your job "${job.title}" has been accepted by ${guard.first_name} ${guard.last_name}. Check the app for details.`
        }
      });

      // Send email notification (via Edge Function)
      await supabase.functions.invoke('send-email-notification', {
        body: {
          to: job.users.email,
          subject: 'Job Accepted - SwiftGuard',
          message: `Your job "${job.title}" has been accepted by ${guard.first_name} ${guard.last_name}. Check the app for details.`
        }
      });

    } catch (error) {
      console.error('Error sending job accepted notification:', error);
    }
  }

  // Get job details with all related information
  static async getJobDetails(jobId: string): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          users!jobs_client_id_fkey (
            first_name,
            last_name,
            business_name,
            phone,
            email
          ),
          job_guards (
            *,
            users!job_guards_guard_id_fkey (
              first_name,
              last_name,
              phone,
              email
            )
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching job details:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching job details:', error);
      return null;
    }
  }

  // Update job status
  static async updateJobStatus(jobId: string, status: Job['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', jobId);

      if (error) {
        console.error('Error updating job status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating job status:', error);
      return false;
    }
  }

  // Cancel a job
  static async cancelJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);

      if (error) {
        console.error('Error cancelling job:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error cancelling job:', error);
      return false;
    }
  }
} 