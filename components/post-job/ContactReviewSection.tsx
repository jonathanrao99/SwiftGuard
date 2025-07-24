import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Alert, Switch } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { COLORS, SPACING } from '../../theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { PricingBreakdown } from '../../services/PricingService';

// Summary helper argument type
interface ContactReviewSummaryArgs {
  control: Control<any>;
}
export function getContactReviewSummary({ control }: ContactReviewSummaryArgs): { label: string; value: string }[] {
  return [
    { label: 'Manager Name', value: control?._formValues?.managerName || '' },
    { label: 'Manager Phone', value: control?._formValues?.managerPhone || '' },
  ];
}

interface ContactReviewSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  estimatedCost: string;
  pricingBreakdown?: PricingBreakdown | null;
}
export const ContactReviewSection: React.FC<ContactReviewSectionProps> = React.memo(({
  control,
  errors,
  estimatedCost,
  pricingBreakdown,
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Contact Information</Text>
      <View>
        {/* Manager Name */}
        <Text style={styles.label}>Manager Name (On-site Contact)</Text>
        <Controller
          control={control}
          name="managerName"
          rules={{ required: 'Manager name is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.managerName && styles.inputError]}
              placeholder="E.g., John Doe"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.managerName?.message && (
          <Text style={styles.errorText}>{String(errors.managerName.message)}</Text>
        )}

        {/* Manager Phone */}
        <Text style={styles.label}>Manager Phone</Text>
        <Controller
          control={control}
          name="managerPhone"
          rules={{
            required: 'Manager phone is required',
            pattern: { value: /^\+?\d{7,15}$/, message: 'Enter a valid 7-15 digit phone number' },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.managerPhone && styles.inputError]}
              placeholder="E.g., +15551234567"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
            />
          )}
        />
        {errors.managerPhone?.message && (
          <Text style={styles.errorText}>{String(errors.managerPhone.message)}</Text>
        )}

        {/* Enhanced SwiftScan Section */}
        <View style={styles.swiftScanContainer}>
          {/* Promotional Badge */}
          
          {/* Main SwiftScan Card */}
          <View style={styles.swiftScanCard}>
            <View style={styles.swiftScanHeader}>
              <View style={styles.swiftScanIcon}>
                <Feather name="zap" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.swiftScanTitleContainer}>
                <Text style={styles.swiftScanTitle}>SwiftScan™ Pro</Text>
                <Text style={styles.swiftScanTagline}>Lightning-fast ID verification</Text>
              </View>
              <Controller
                control={control}
                name="idScannerService"
                defaultValue={false}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.switchContainer}>
                    <Switch 
                      value={value} 
                      onValueChange={onChange}
                      trackColor={{ false: COLORS.border, true: COLORS.primary }}
                      thumbColor={value ? COLORS.white : COLORS.textSecondary}
                    />
                  </View>
                )}
              />
            </View>

            {/* Free Offer Highlight */}
            <View style={styles.freeOfferBox}>
              <Text style={styles.freeOfferText}>
                🎉 <Text style={styles.freeOfferBold}>First 50 scans FREE</Text>
              </Text>
            </View>

            {/* Benefits Grid */}
            <View style={styles.benefitsGrid}>
              <View style={styles.benefitItem}>
                <Feather name="clock" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>Instant verification</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>Age validation</Text>
              </View>
              <View style={styles.benefitItem}>
                <Feather name="smartphone" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>Phone camera scan</Text>
              </View>
              <View style={styles.benefitItem}>
                <Feather name="bar-chart-2" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>Live dashboard</Text>
              </View>
            </View>

            {/* Pricing */}
            <View style={styles.pricingContainer}>
              <View style={styles.pricingLeft}>
                <Text style={styles.pricingStrikethrough}>$0.50 per scan</Text>
                <Text style={styles.pricingFree}>FREE for first 50 scans</Text>
              </View>
              <View style={styles.pricingRight}>
                <Text style={styles.pricingSavings}>You save $25</Text>
              </View>
            </View>

            {/* How it Works */}
            <View style={styles.howItWorksContainer}>
              <Text style={styles.howItWorksTitle}>How SwiftScan Works:</Text>
              <View style={styles.stepContainer}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Guard opens app & scans ID</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>AI validates authenticity instantly</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Results appear on your dashboard</Text>
                </View>
              </View>
            </View>

            {/* Privacy Notice */}
            <View style={styles.privacyNotice}>
              <Feather name="lock" size={12} color={COLORS.textSecondary} />
              <Text style={styles.privacyText}>
                Privacy-first: No ID data stored, only scan results & timestamps
              </Text>
            </View>
          </View>
        </View>

        {/* Detailed Pricing Breakdown */}
        {pricingBreakdown && (
          <View style={styles.pricingBreakdownCard}>
            <Text style={styles.pricingBreakdownTitle}>💰 Cost Breakdown</Text>
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Base Rate:</Text>
              <Text style={styles.pricingValue}>${pricingBreakdown.baseRate.toFixed(2)}/hr</Text>
            </View>
            
            {Object.entries(pricingBreakdown.requirementAdjustments).map(([req, adj]) => (
              <View key={req} style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>{req.charAt(0).toUpperCase() + req.slice(1)}:</Text>
                <Text style={styles.pricingValue}>+${adj.toFixed(2)}/hr</Text>
              </View>
            ))}
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Guard Multiplier:</Text>
              <Text style={styles.pricingValue}>{(pricingBreakdown.guardMultiplier * 100).toFixed(0)}%</Text>
            </View>
            
            <View style={styles.pricingDivider} />
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Total Hourly Rate:</Text>
              <Text style={styles.pricingValue}>${pricingBreakdown.totalHourlyRate.toFixed(2)}/hr</Text>
            </View>
          </View>
        )}

        {/* Estimated Cost */}
        <View style={styles.estimateBox}>
          <Text style={styles.estimateLabel}>Total Estimated Cost</Text>
          <Text style={styles.estimateValue}>{estimatedCost}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: 'transparent',
    width: '100%',
    alignSelf: 'center',
    borderRadius: 12,
    padding: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    fontSize: 15,
    marginBottom: SPACING.xs,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  estimateBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  estimateLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  estimateValue: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },

  // Enhanced SwiftScan Styles
  swiftScanContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  promoBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  promoBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  swiftScanCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  swiftScanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  swiftScanIcon: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  swiftScanTitleContainer: {
    flex: 1,
  },
  swiftScanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  swiftScanTagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  switchContainer: {
    marginLeft: SPACING.sm,
  },
  freeOfferBox: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  freeOfferText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
  freeOfferBold: {
    fontWeight: '700',
    fontSize: 15,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: SPACING.sm,
  },
  benefitText: {
    fontSize: 13,
    color: COLORS.textDark,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  pricingLeft: {
    flex: 1,
  },
  pricingStrikethrough: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  pricingFree: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  pricingRight: {
    alignItems: 'flex-end',
  },
  pricingSavings: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  howItWorksContainer: {
    marginBottom: SPACING.md,
  },
  howItWorksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  stepContainer: {
    marginLeft: SPACING.xs,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stepNumber: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 13,
    color: COLORS.textDark,
    flex: 1,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: SPACING.sm,
  },
  privacyText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    flex: 1,
    fontStyle: 'italic',
  },
  pricingBreakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pricingBreakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  pricingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
});