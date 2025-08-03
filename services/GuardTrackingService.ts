import { supabase } from '../supabaseClient';
import { GuardTracking, User, Job } from '../types';

export interface GuardStatus {
  guard: User;
  tracking: GuardTracking;
  job: Job;
  checkpointCount: number;
  lastCheckpoint?: string;
  batteryLevel?: number;
  isOnline: boolean;
}

class GuardTrackingService {
  private subscriptions: Map<string, any> = new Map();

  /**
   * Load real guard tracking data from Supabase
   */
  async loadGuardData(): Promise<GuardStatus[]> {
    try {
      const { data: trackingData, error: trackingError } = await supabase
        .from('guard_tracking')
        .select(`
          *,
          guards:guard_id (
            id,
            first_name,
            last_name,
            email,
            role,
            status,
            experience_level,
            created_at
          ),
          jobs:job_id (
            id,
            title,
            location,
            venue_type,
            start_time,
            end_time,
            status,
            created_at
          )
        `)
        .eq('is_online', true)
        .order('last_seen', { ascending: false });

      if (trackingError) {
        console.error('Error loading guard tracking data:', trackingError);
        return [];
      }

      // Transform data to match GuardStatus interface
      const guardStatuses: GuardStatus[] = await Promise.all(
        trackingData.map(async (tracking) => {
          // Get checkpoint count for this guard
          const { count: checkpointCount } = await supabase
            .from('shift_checkpoints')
            .select('*', { count: 'exact', head: true })
            .eq('guard_id', tracking.guard_id)
            .eq('job_id', tracking.job_id);

          // Get last checkpoint
          const { data: lastCheckpoint } = await supabase
            .from('shift_checkpoints')
            .select('checked_at, checkpoint_name')
            .eq('guard_id', tracking.guard_id)
            .eq('job_id', tracking.job_id)
            .order('checked_at', { ascending: false })
            .limit(1)
            .single();

          return {
            guard: tracking.guards,
            tracking: tracking,
            job: tracking.jobs,
            checkpointCount: checkpointCount || 0,
            lastCheckpoint: lastCheckpoint 
              ? `${lastCheckpoint.checkpoint_name} - ${this.formatTimeAgo(lastCheckpoint.checked_at)}`
              : undefined,
            batteryLevel: tracking.battery_level,
            isOnline: tracking.is_online,
          };
        })
      );

      return guardStatuses;
    } catch (error) {
      console.error('Error in loadGuardData:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time guard tracking updates
   */
  subscribeToGuardUpdates(jobId: string, callback: (guardStatuses: GuardStatus[]) => void) {
    // Unsubscribe from existing subscription if any
    if (this.subscriptions.has(jobId)) {
      this.subscriptions.get(jobId).unsubscribe();
    }

    const subscription = supabase
      .channel(`guard_tracking_${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guard_tracking',
          filter: `job_id=eq.${jobId}`,
        },
        async (payload) => {
          // Reload data when tracking updates
          const guardStatuses = await this.loadGuardData();
          callback(guardStatuses);
        }
      )
      .subscribe();

    this.subscriptions.set(jobId, subscription);
  }

  /**
   * Update guard location
   */
  async updateGuardLocation(
    guardId: string,
    jobId: string,
    latitude: number,
    longitude: number,
    batteryLevel?: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('guard_tracking')
        .upsert({
          guard_id: guardId,
          job_id: jobId,
          latitude,
          longitude,
          battery_level: batteryLevel,
          is_online: true,
          last_seen: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating guard location:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateGuardLocation:', error);
      return false;
    }
  }

  /**
   * Set guard online/offline status
   */
  async setGuardStatus(guardId: string, jobId: string, isOnline: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('guard_tracking')
        .upsert({
          guard_id: guardId,
          job_id: jobId,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        });

      if (error) {
        console.error('Error setting guard status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setGuardStatus:', error);
      return false;
    }
  }

  /**
   * Get guard tracking history
   */
  async getGuardTrackingHistory(guardId: string, jobId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('guard_tracking')
        .select('*')
        .eq('guard_id', guardId)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting guard tracking history:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error in getGuardTrackingHistory:', error);
      return [];
    }
  }

  /**
   * Cleanup subscriptions
   */
  unsubscribeFromGuardUpdates(jobId: string) {
    if (this.subscriptions.has(jobId)) {
      this.subscriptions.get(jobId).unsubscribe();
      this.subscriptions.delete(jobId);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Format time ago for display
   */
  private formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }
}

export default new GuardTrackingService(); 