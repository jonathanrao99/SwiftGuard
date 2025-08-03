import { supabase } from '../supabaseClient';

export interface CheckpointLocation {
  id: string;
  job_id: string;
  name: string;
  latitude: number;
  longitude: number;
  required_photo: boolean;
  description?: string;
  order_index: number;
}

export interface CheckpointSubmission {
  guard_id: string;
  job_id: string;
  checkpoint_id: string;
  checkpoint_name: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  notes?: string;
  checked_at: string;
}

class CheckpointService {
  /**
   * Load checkpoint locations for a specific job
   */
  async loadCheckpointLocations(jobId: string): Promise<CheckpointLocation[]> {
    try {
      const { data, error } = await supabase
        .from('checkpoint_locations')
        .select('*')
        .eq('job_id', jobId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading checkpoint locations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in loadCheckpointLocations:', error);
      return [];
    }
  }

  /**
   * Submit a checkpoint completion
   */
  async submitCheckpoint(submission: CheckpointSubmission): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shift_checkpoints')
        .insert({
          guard_id: submission.guard_id,
          job_id: submission.job_id,
          checkpoint_id: submission.checkpoint_id,
          checkpoint_name: submission.checkpoint_name,
          latitude: submission.latitude,
          longitude: submission.longitude,
          photo_url: submission.photo_url,
          notes: submission.notes,
          checked_at: submission.checked_at,
        });

      if (error) {
        console.error('Error submitting checkpoint:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in submitCheckpoint:', error);
      return false;
    }
  }

  /**
   * Upload checkpoint photo
   */
  async uploadCheckpointPhoto(photoUri: string, guardId: string, jobId: string): Promise<string | null> {
    try {
      const fileName = `checkpoints/${jobId}/${guardId}/${Date.now()}.jpg`;
      
      // Convert photo URI to blob
      const response = await fetch(photoUri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('checkpoint-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (error) {
        console.error('Error uploading checkpoint photo:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('checkpoint-photos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadCheckpointPhoto:', error);
      return null;
    }
  }

  /**
   * Get checkpoint completion history for a guard on a job
   */
  async getCheckpointHistory(guardId: string, jobId: string): Promise<CheckpointSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('shift_checkpoints')
        .select('*')
        .eq('guard_id', guardId)
        .eq('job_id', jobId)
        .order('checked_at', { ascending: false });

      if (error) {
        console.error('Error getting checkpoint history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCheckpointHistory:', error);
      return [];
    }
  }

  /**
   * Get checkpoint completion status for a job
   */
  async getJobCheckpointStatus(jobId: string): Promise<{
    totalCheckpoints: number;
    completedCheckpoints: number;
    guards: Array<{
      guard_id: string;
      guard_name: string;
      completed_count: number;
      last_checkpoint?: string;
    }>;
  }> {
    try {
      // Get total checkpoints for the job
      const { count: totalCheckpoints } = await supabase
        .from('checkpoint_locations')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId);

      // Get completed checkpoints by guard
      const { data: completedData, error } = await supabase
        .from('shift_checkpoints')
        .select(`
          guard_id,
          checkpoint_name,
          checked_at,
          guards:guard_id (
            first_name,
            last_name
          )
        `)
        .eq('job_id', jobId)
        .order('checked_at', { ascending: false });

      if (error) {
        console.error('Error getting checkpoint status:', error);
        return {
          totalCheckpoints: totalCheckpoints || 0,
          completedCheckpoints: 0,
          guards: [],
        };
      }

      // Group by guard
      const guardMap = new Map();
      completedData?.forEach((checkpoint) => {
        const guardId = checkpoint.guard_id;
        if (!guardMap.has(guardId)) {
          guardMap.set(guardId, {
            guard_id: guardId,
            guard_name: `${checkpoint.guards.first_name} ${checkpoint.guards.last_name}`,
            completed_count: 0,
            last_checkpoint: checkpoint.checked_at,
          });
        }
        guardMap.get(guardId).completed_count++;
      });

      const guards = Array.from(guardMap.values());
      const completedCheckpoints = completedData?.length || 0;

      return {
        totalCheckpoints: totalCheckpoints || 0,
        completedCheckpoints,
        guards,
      };
    } catch (error) {
      console.error('Error in getJobCheckpointStatus:', error);
      return {
        totalCheckpoints: 0,
        completedCheckpoints: 0,
        guards: [],
      };
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Find nearest checkpoint to current location
   */
  findNearestCheckpoint(
    currentLat: number,
    currentLon: number,
    checkpoints: CheckpointLocation[]
  ): CheckpointLocation & { distance: number } | null {
    if (!checkpoints.length) return null;

    let nearest: CheckpointLocation & { distance: number } | null = null;
    let minDistance = Infinity;

    checkpoints.forEach((checkpoint) => {
      const distance = this.calculateDistance(
        currentLat,
        currentLon,
        checkpoint.latitude,
        checkpoint.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...checkpoint, distance };
      }
    });

    return nearest;
  }

  /**
   * Check if guard is within acceptable distance of checkpoint
   */
  isWithinCheckpointRange(distance: number, maxDistance: number = 50): boolean {
    return distance <= maxDistance; // 50 meters default
  }
}

export default new CheckpointService(); 