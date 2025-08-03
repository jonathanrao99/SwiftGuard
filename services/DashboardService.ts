import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface DashboardJob {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
  hourlyPay?: number;
  totalAmount?: number;
  requiredGuards?: number;
  assignedGuards?: number;
}

export interface DashboardEarnings {
  total: number;
  thisWeek: number;
  thisMonth: number;
  pending: number;
}

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  averageRating: number;
}

class DashboardService {
  /**
   * Get client dashboard data
   */
  async getClientDashboardData(userId: string): Promise<{
    jobs: DashboardJob[];
    stats: DashboardStats;
  }> {
    try {
      // Get user's jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          event_dates,
          start_time,
          end_time,
          location,
          status,
          hourly_pay,
          total_amount,
          num_guards,
          job_guards (
            id,
            guard_id,
            status
          )
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsError) {
        console.error('Error fetching client jobs:', jobsError);
        return { jobs: [], stats: this.getDefaultStats() };
      }

      // Transform jobs data
      const transformedJobs: DashboardJob[] = (jobs || []).map(job => ({
        id: job.id,
        title: job.title,
        date: job.event_dates?.[0] || '',
        time: `${job.start_time} - ${job.end_time}`,
        location: job.location,
        status: job.status,
        hourlyPay: job.hourly_pay,
        totalAmount: job.total_amount,
        requiredGuards: job.num_guards,
        assignedGuards: job.job_guards?.length || 0,
      }));

      // Calculate stats
      const stats = this.calculateClientStats(transformedJobs);

      return { jobs: transformedJobs, stats };
    } catch (error) {
      console.error('Error in getClientDashboardData:', error);
      return { jobs: [], stats: this.getDefaultStats() };
    }
  }

  /**
   * Get guard dashboard data
   */
  async getGuardDashboardData(userId: string): Promise<{
    jobs: DashboardJob[];
    earnings: DashboardEarnings;
    stats: DashboardStats;
  }> {
    try {
      // Get guard's assigned jobs
      const { data: jobAssignments, error: assignmentsError } = await supabase
        .from('job_guards')
        .select(`
          id,
          status,
          jobs (
            id,
            title,
            event_dates,
            start_time,
            end_time,
            location,
            status,
            hourly_pay,
            total_amount,
            num_guards
          )
        `)
        .eq('guard_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (assignmentsError) {
        console.error('Error fetching guard jobs:', assignmentsError);
        return { 
          jobs: [], 
          earnings: this.getDefaultEarnings(),
          stats: this.getDefaultStats()
        };
      }

      // Transform jobs data
      const transformedJobs: DashboardJob[] = (jobAssignments || [])
        .filter(assignment => assignment.jobs)
        .map(assignment => ({
          id: assignment.jobs.id,
          title: assignment.jobs.title,
          date: assignment.jobs.event_dates?.[0] || '',
          time: `${assignment.jobs.start_time} - ${assignment.jobs.end_time}`,
          location: assignment.jobs.location,
          status: assignment.status,
          hourlyPay: assignment.jobs.hourly_pay,
          totalAmount: assignment.jobs.total_amount,
        }));

      // Calculate earnings
      const earnings = await this.calculateGuardEarnings(userId);

      // Calculate stats
      const stats = this.calculateGuardStats(transformedJobs);

      return { jobs: transformedJobs, earnings, stats };
    } catch (error) {
      console.error('Error in getGuardDashboardData:', error);
      return { 
        jobs: [], 
        earnings: this.getDefaultEarnings(),
        stats: this.getDefaultStats()
      };
    }
  }

  /**
   * Calculate guard earnings
   */
  private async calculateGuardEarnings(userId: string): Promise<DashboardEarnings> {
    try {
      // Get completed jobs
      const { data: completedJobs, error } = await supabase
        .from('job_guards')
        .select(`
          jobs (
            hourly_pay,
            total_amount,
            num_guards,
            duration
          )
        `)
        .eq('guard_id', userId)
        .eq('status', 'completed');

      if (error) {
        console.error('Error calculating earnings:', error);
        return this.getDefaultEarnings();
      }

      const total = (completedJobs || []).reduce((sum, assignment) => {
        const job = assignment.jobs;
        const guardShare = job.total_amount / job.num_guards;
        return sum + guardShare;
      }, 0);

      // For now, return simplified earnings
      // In a real app, you'd calculate weekly/monthly/pending amounts
      return {
        total,
        thisWeek: total * 0.3, // 30% of total
        thisMonth: total * 0.7, // 70% of total
        pending: total * 0.1, // 10% pending
      };
    } catch (error) {
      console.error('Error calculating guard earnings:', error);
      return this.getDefaultEarnings();
    }
  }

  /**
   * Calculate client stats
   */
  private calculateClientStats(jobs: DashboardJob[]): DashboardStats {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const totalEarnings = jobs.reduce((sum, job) => sum + (job.totalAmount || 0), 0);
    const averageRating = 4.5; // This would come from reviews

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      totalEarnings,
      averageRating,
    };
  }

  /**
   * Calculate guard stats
   */
  private calculateGuardStats(jobs: DashboardJob[]): DashboardStats {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const totalEarnings = jobs.reduce((sum, job) => sum + (job.totalAmount || 0), 0);
    const averageRating = 4.8; // This would come from reviews

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      totalEarnings,
      averageRating,
    };
  }

  /**
   * Get default stats
   */
  private getDefaultStats(): DashboardStats {
    return {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      totalEarnings: 0,
      averageRating: 0,
    };
  }

  /**
   * Get default earnings
   */
  private getDefaultEarnings(): DashboardEarnings {
    return {
      total: 0,
      thisWeek: 0,
      thisMonth: 0,
      pending: 0,
    };
  }

  /**
   * Update guard status
   */
  async updateGuardStatus(userId: string, status: 'available' | 'busy' | 'offline'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', userId);

      if (error) {
        console.error('Error updating guard status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateGuardStatus:', error);
      return false;
    }
  }

  /**
   * Get guard status
   */
  async getGuardStatus(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('status')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error getting guard status:', error);
        return 'offline';
      }

      return data.status || 'offline';
    } catch (error) {
      console.error('Error in getGuardStatus:', error);
      return 'offline';
    }
  }
}

export default new DashboardService(); 