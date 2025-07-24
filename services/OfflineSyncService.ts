
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../supabaseClient';

interface OfflineIncident {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photos?: string[];
  witnesses?: string[];
  police_notified: boolean;
  police_case_number?: string;
  created_at: string;
}

interface OfflineMessage {
  id: string;
  receiver_id: string;
  job_id?: string;
  content: string;
  type: string;
  created_at: string;
}

class OfflineSyncService {
  private readonly INCIDENTS_KEY = 'offline_incidents';
  private readonly MESSAGES_KEY = 'offline_messages';

  async storeIncidentOffline(incident: OfflineIncident): Promise<void> {
    try {
      const existingIncidents = await this.getOfflineIncidents();
      existingIncidents.push(incident);
      await AsyncStorage.setItem(this.INCIDENTS_KEY, JSON.stringify(existingIncidents));
    } catch (error) {
      // Handle error silently in production
    }
  }

  async storeMessageOffline(message: OfflineMessage): Promise<void> {
    try {
      const existingMessages = await this.getOfflineMessages();
      existingMessages.push(message);
      await AsyncStorage.setItem(this.MESSAGES_KEY, JSON.stringify(existingMessages));
    } catch (error) {
      // Handle error silently in production
    }
  }

  async syncOfflineData(): Promise<void> {
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected) {
      await this.syncOfflineIncidents();
      await this.syncOfflineMessages();
    }
  }

  private async getOfflineIncidents(): Promise<OfflineIncident[]> {
    try {
      const incidents = await AsyncStorage.getItem(this.INCIDENTS_KEY);
      return incidents ? JSON.parse(incidents) : [];
    } catch {
      return [];
    }
  }

  private async getOfflineMessages(): Promise<OfflineMessage[]> {
    try {
      const messages = await AsyncStorage.getItem(this.MESSAGES_KEY);
      return messages ? JSON.parse(messages) : [];
    } catch {
      return [];
    }
  }

  private async syncOfflineIncidents(): Promise<void> {
    const incidents = await this.getOfflineIncidents();
    
    for (const incident of incidents) {
      try {
        const { error } = await supabase
          .from('incidents')
          .insert(incident);
        
        if (!error) {
          // Remove from offline storage after successful sync
          const remainingIncidents = incidents.filter(i => i.id !== incident.id);
          await AsyncStorage.setItem(this.INCIDENTS_KEY, JSON.stringify(remainingIncidents));
        }
      } catch (error) {
        // Continue with next incident if one fails
      }
    }
  }

  private async syncOfflineMessages(): Promise<void> {
    const messages = await this.getOfflineMessages();
    
    for (const message of messages) {
      try {
        const { error } = await supabase
          .from('messages')
          .insert(message);
        
        if (!error) {
          // Remove from offline storage after successful sync
          const remainingMessages = messages.filter(m => m.id !== message.id);
          await AsyncStorage.setItem(this.MESSAGES_KEY, JSON.stringify(remainingMessages));
        }
      } catch (error) {
        // Continue with next message if one fails
      }
    }
  }

  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.INCIDENTS_KEY, this.MESSAGES_KEY]);
    } catch (error) {
      // Handle error silently in production
    }
  }
}

export default new OfflineSyncService();
