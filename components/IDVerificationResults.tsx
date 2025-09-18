/**
 * ID Verification Results Component
 * Displays the results of ID verification
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme';

interface IDVerificationData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  documentNumber?: string;
  documentType?: string;
  expirationDate?: string;
  address?: string;
  nationality?: string;
  gender?: string;
  confidence?: number;
  isVerified?: boolean;
}

interface IDVerificationResultsProps {
  visible: boolean;
  onClose: () => void;
  data?: IDVerificationData;
  loading?: boolean;
  error?: string;
}

export default function IDVerificationResults({ 
  visible, 
  onClose, 
  data, 
  loading = false, 
  error 
}: IDVerificationResultsProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return '#64748b';
    if (confidence >= 80) return '#10b981';
    if (confidence >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getVerificationStatus = () => {
    if (loading) return { text: 'Verifying...', color: '#64748b', icon: 'hourglass-empty' };
    if (error) return { text: 'Verification Failed', color: '#ef4444', icon: 'error' };
    if (data?.isVerified) return { text: 'Verified', color: '#10b981', icon: 'check-circle' };
    return { text: 'Not Verified', color: '#f59e0b', icon: 'warning' };
  };

  const status = getVerificationStatus();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ID Verification Results</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Analyzing ID document...</Text>
              <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={64} color="#ef4444" />
              <Text style={styles.errorTitle}>Verification Failed</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onClose}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : data ? (
            <>
              {/* Verification Status */}
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <MaterialIcons name={status.icon} size={24} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.text}
                  </Text>
                </View>
                {data.confidence && (
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>Confidence Level</Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceFill, 
                          { 
                            width: `${data.confidence}%`,
                            backgroundColor: getConfidenceColor(data.confidence)
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.confidenceText, { color: getConfidenceColor(data.confidence) }]}>
                      {data.confidence}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Personal Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={styles.infoCard}>
                  <InfoRow 
                    label="Full Name" 
                    value={data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : 'N/A'} 
                  />
                  <InfoRow label="Date of Birth" value={formatDate(data.dateOfBirth)} />
                  <InfoRow label="Gender" value={data.gender || 'N/A'} />
                  <InfoRow label="Nationality" value={data.nationality || 'N/A'} />
                </View>
              </View>

              {/* Document Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Document Information</Text>
                <View style={styles.infoCard}>
                  <InfoRow label="Document Type" value={data.documentType || 'N/A'} />
                  <InfoRow label="Document Number" value={data.documentNumber || 'N/A'} />
                  <InfoRow label="Expiration Date" value={formatDate(data.expirationDate)} />
                </View>
              </View>

              {/* Address Information */}
              {data.address && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Address</Text>
                  <View style={styles.infoCard}>
                    <InfoRow label="Address" value={data.address} />
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={onClose}>
                  <MaterialIcons name="refresh" size={20} color={COLORS.primary} />
                  <Text style={styles.actionButtonText}>Scan Another ID</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={onClose}>
                  <MaterialIcons name="check" size={20} color="white" />
                  <Text style={[styles.actionButtonText, styles.primaryActionText]}>Done</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: SPACING.md,
  },
  loadingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.lg,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  confidenceContainer: {
    marginTop: SPACING.sm,
  },
  confidenceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
    flex: 2,
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'white',
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  primaryActionText: {
    color: 'white',
  },
});
