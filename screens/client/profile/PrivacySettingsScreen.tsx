/**
 * SwiftGuard Privacy Settings Screen
 * Allows users to manage their privacy preferences and submit data subject requests
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../supabaseClient';
import { logger } from '../../../utils/Logger';

interface PrivacyRequest {
  id: string;
  action: string;
  status: string;
  requested_at: string;
  completed_at?: string;
  grace_period_ends?: string;
}

interface PrivacySummary {
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  active_restrictions: number;
  data_exports_count: number;
  last_request_date?: string;
}

export default function PrivacySettingsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [privacySummary, setPrivacySummary] = useState<PrivacySummary | null>(null);
  const [recentRequests, setRecentRequests] = useState<PrivacyRequest[]>([]);
  const [processingRestricted, setProcessingRestricted] = useState(false);

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load privacy summary
      const { data: summary, error: summaryError } = await supabase.rpc(
        'get_user_privacy_summary',
        { p_user_id: user.id }
      );

      if (summaryError) {
        logger.error('Failed to load privacy summary', { error: summaryError.message });
        throw summaryError;
      }

      if (summary && summary.length > 0) {
        setPrivacySummary(summary[0]);
      }

      // Load recent requests
      const { data: requests, error: requestsError } = await supabase
        .from('privacy_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(5);

      if (requestsError) {
        logger.error('Failed to load privacy requests', { error: requestsError.message });
        throw requestsError;
      }

      setRecentRequests(requests || []);

      // Check processing restrictions
      const { data: restrictions, error: restrictionsError } = await supabase
        .from('processing_restrictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (restrictionsError) {
        logger.error('Failed to load processing restrictions', { error: restrictionsError.message });
        throw restrictionsError;
      }

      setProcessingRestricted(restrictions && restrictions.length > 0);

    } catch (error) {
      logger.error('Failed to load privacy data', { error: (error as Error).message });
      Alert.alert('Error', 'Failed to load privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitPrivacyRequest = async (action: string, reason?: string) => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('privacy-request', {
        body: {
          action,
          user_id: user.id,
          reason,
          urgency: 'medium',
          contact_method: 'email',
        },
      });

      if (error) {
        logger.error('Failed to submit privacy request', { error: error.message });
        throw error;
      }

      if (data.success) {
        Alert.alert('Success', data.message);
        loadPrivacyData(); // Refresh data
        logger.info('Privacy request submitted', { action, userId: user.id });
      } else {
        Alert.alert('Error', data.message || 'Failed to submit request');
      }

    } catch (error) {
      logger.error('Failed to submit privacy request', { error: (error as Error).message });
      Alert.alert('Error', 'Failed to submit privacy request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Export My Data',
      'This will generate a complete copy of your data including profile, jobs, payments, and ratings. The export will be available for download for 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => submitPrivacyRequest('export_my_data'),
        },
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete My Data',
      'This will permanently delete all your data after a 30-day grace period. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Reason for Deletion',
              'Please provide a reason for deleting your data (optional):',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Submit',
                  onPress: (reason) => submitPrivacyRequest('delete_my_data', reason),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleRectifyData = () => {
    Alert.prompt(
      'Rectify My Data',
      'Please describe what data needs to be corrected:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: (reason) => submitPrivacyRequest('rectify_my_data', reason),
        },
      ]
    );
  };

  const handleRestrictProcessing = () => {
    Alert.alert(
      'Restrict Data Processing',
      'This will limit how your data is used for marketing and analytics. Essential service data will still be processed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restrict',
          onPress: () => submitPrivacyRequest('restrict_processing'),
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'processing': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'export_my_data': return 'Data Export';
      case 'delete_my_data': return 'Data Deletion';
      case 'rectify_my_data': return 'Data Rectification';
      case 'restrict_processing': return 'Processing Restriction';
      default: return action;
    }
  };

  if (loading && !privacySummary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading privacy settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Settings</Text>
          <Text style={styles.subtitle}>
            Manage your data and privacy preferences
          </Text>
        </View>

        {/* Privacy Summary */}
        {privacySummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{privacySummary.total_requests}</Text>
                <Text style={styles.summaryLabel}>Total Requests</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{privacySummary.pending_requests}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{privacySummary.completed_requests}</Text>
                <Text style={styles.summaryLabel}>Completed</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{privacySummary.active_restrictions}</Text>
                <Text style={styles.summaryLabel}>Restrictions</Text>
              </View>
            </View>
          </View>
        )}

        {/* Processing Restrictions Status */}
        {processingRestricted && (
          <View style={styles.section}>
            <View style={styles.restrictionBanner}>
              <Text style={styles.restrictionTitle}>Processing Restricted</Text>
              <Text style={styles.restrictionText}>
                Your data processing is currently restricted. Only essential service data is being processed.
              </Text>
            </View>
          </View>
        )}

        {/* Data Subject Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data Rights</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportData}
            disabled={loading}
          >
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Export My Data</Text>
              <Text style={styles.actionDescription}>
                Download a complete copy of your data
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRectifyData}
            disabled={loading}
          >
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Rectify My Data</Text>
              <Text style={styles.actionDescription}>
                Request correction of inaccurate data
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRestrictProcessing}
            disabled={loading}
          >
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Restrict Processing</Text>
              <Text style={styles.actionDescription}>
                Limit how your data is used
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDeleteData}
            disabled={loading}
          >
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.dangerText]}>Delete My Data</Text>
              <Text style={styles.actionDescription}>
                Permanently delete all your data
              </Text>
            </View>
            <Text style={[styles.actionArrow, styles.dangerText]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Requests */}
        {recentRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Requests</Text>
            {recentRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestAction}>
                    {getActionLabel(request.action)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{request.status}</Text>
                  </View>
                </View>
                <Text style={styles.requestDate}>
                  Requested: {new Date(request.requested_at).toLocaleDateString()}
                </Text>
                {request.completed_at && (
                  <Text style={styles.requestDate}>
                    Completed: {new Date(request.completed_at).toLocaleDateString()}
                  </Text>
                )}
                {request.grace_period_ends && (
                  <Text style={styles.gracePeriod}>
                    Grace period ends: {new Date(request.grace_period_ends).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Privacy Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Information</Text>
          <Text style={styles.infoText}>
            • Data exports are available for 30 days after generation
          </Text>
          <Text style={styles.infoText}>
            • Deletion requests have a 30-day grace period
          </Text>
          <Text style={styles.infoText}>
            • Processing restrictions can be removed at any time
          </Text>
          <Text style={styles.infoText}>
            • All requests are processed within 7 days
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <Text style={styles.infoText}>
            For privacy-related questions, contact our Data Protection Officer:
          </Text>
          <Text style={styles.contactInfo}>Email: dpo@swiftguard.com</Text>
          <Text style={styles.contactInfo}>Phone: +1-555-0123</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  restrictionBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  restrictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  restrictionText: {
    fontSize: 14,
    color: '#92400E',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dangerButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  dangerText: {
    color: '#DC2626',
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionArrow: {
    fontSize: 18,
    color: '#6B7280',
    marginLeft: 12,
  },
  requestItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  requestDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  gracePeriod: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  contactInfo: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 4,
  },
});





