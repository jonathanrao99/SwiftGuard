export interface User {
  id: string;
  role: 'client' | 'guard';
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  stripe_customer_id?: string;
  verified_at?: string;
  created_at: string;
  
  // Client-specific fields
  business_name?: string;
  establishment_type?: string;
  location?: string;
  referral_code?: string;
  
  // Guard-specific fields
  gender?: string;
  dob?: string;
  experience_level?: 'Entry' | 'Intermediate' | 'Expert';
  years_experience?: number;
  bio?: string;
  certifications?: string[];
  emergency_contact?: string;
  availability?: string;
  current_location?: {
    latitude: number;
    longitude: number;
    updated_at: string;
  };
  guard_license?: {
    number: string;
    expires_at: string;
    verified: boolean;
  };
  background_check?: {
    status: 'pending' | 'passed' | 'failed' | 'expired';
    expires_at: string;
  };
}

export interface Job {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  location: string;
  venue_type: string;
  custom_venue_type?: string;
  recurring_mode: string;
  recurring_pattern_type?: 'weekly' | 'monthly';
  event_dates: string[];
  start_time: string;
  end_time: string;
  duration: number;
  num_guards: number;
  hourly_pay: number;
  total_amount: number;
  requirements?: string[];
  other_requirement?: string;
  manager_name: string;
  manager_phone: string;
  status: 'pending' | 'paid' | 'active' | 'completed' | 'cancelled';
  payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  job_guards?: JobGuard[];
  priority_level?: 'low' | 'medium' | 'high' | 'urgent';
  special_instructions?: string;
  client_contact_info?: {
    primary_contact: string;
    secondary_contact?: string;
    emergency_contact: string;
  };
  
  // Security-specific fields
  geofence?: {
    latitude: number;
    longitude: number;
    radius: number; // in meters
  };
  checkpoint_locations?: CheckpointLocation[];
  emergency_procedures?: string;
}

export interface JobGuard {
  id: string;
  job_id: string;
  guard_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  checked_in_at?: string;
  checked_out_at?: string;
  hours_worked?: number;
  performance_rating?: number;
  client_feedback?: string;
  guard_notes?: string;
  created_at: string;
  updated_at: string;
  guard?: User;
}

export interface Incident {
  id: string;
  guard_id: string;
  job_id?: string;
  type: 'theft' | 'vandalism' | 'trespassing' | 'medical' | 'fire' | 'suspicious_activity' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
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
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface CheckpointLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  required_photo: boolean;
  instructions?: string;
}

export interface ShiftCheckpoint {
  id: string;
  guard_id: string;
  job_id: string;
  checkpoint_location_id: string;
  checked_at: string;
  photo_url?: string;
  notes?: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface GuardTracking {
  id: string;
  guard_id: string;
  job_id?: string;
  latitude: number;
  longitude: number;
  battery_level?: number;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  guard_id: string;
  job_id?: string;
  type: 'panic' | 'medical' | 'security_breach' | 'fire' | 'other';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  message?: string;
  status: 'active' | 'responding' | 'resolved';
  response_time?: number; // in seconds
  responders?: string[];
  created_at: string;
  resolved_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  job_id?: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'emergency';
  read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'job_assigned' | 'emergency' | 'incident' | 'check_in_reminder' | 'payment' | 'system';
  data?: any;
  read: boolean;
  created_at: string;
}

export type NavigationProps = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  replace: (screen: string, params?: any) => void;
  reset: (options: any) => void;
}

// Navigation parameter types for different screens
export interface JobDetailsScreenProps {
  route: { params: { jobId: string } };
  navigation: NavigationProps;
}

export interface TrackJobScreenProps {
  route: { params: { jobId: string } };
  navigation: NavigationProps;
}

export interface GuardJobDetailsScreenProps {
  route: { params: { jobId: string } };
  navigation: NavigationProps;
}

export interface GuardModeProps {
  route: { params: { jobId: string } };
  navigation: NavigationProps;
}

export interface PostJobSpecializedProps {
  route: { params: { jobId?: string } };
  navigation: NavigationProps;
}

export interface JobPostedSuccessScreenProps {
  route: { params: { jobId: string } };
  navigation: NavigationProps;
}

export interface AllReviewsScreenProps {
  route: { params: { guard: any; reviews: any[] } };
  navigation: NavigationProps;
}

export interface LeaveReviewScreenProps {
  route: { params: { jobId: string; guardId: string } };
  navigation: NavigationProps;
}

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  totalHours: number;
  incidentCount: number;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  action: () => void;
  urgent?: boolean;
  badge?: number;
} 