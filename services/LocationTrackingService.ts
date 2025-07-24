
import { LocationObject, LocationSubscription } from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '../supabaseClient';

const LOCATION_TRACKING_TASK = 'location-tracking';

interface LocationUpdateCallback {
  (location: LocationObject): void;
}

class LocationTrackingService {
  private locationSubscription: LocationSubscription | null = null;
  private isTracking = false;
  private updateCallback: LocationUpdateCallback | null = null;

  async startTracking(callback: LocationUpdateCallback): Promise<void> {
    if (this.isTracking) {
      return;
    }

    this.updateCallback = callback;
    this.isTracking = true;

    // Start background location tracking
    await this.startBackgroundTracking();
  }

  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;
    this.updateCallback = null;

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    await TaskManager.unregisterTaskAsync(LOCATION_TRACKING_TASK);
  }

  private async startBackgroundTracking(): Promise<void> {
    // Implementation for background location tracking
    // This would use expo-location's background location updates
  }

  private handleLocationUpdate(location: LocationObject): void {
    if (this.updateCallback) {
      this.updateCallback(location);
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export default new LocationTrackingService();
