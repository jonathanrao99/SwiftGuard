import React, { Dispatch, SetStateAction, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { COLORS, SPACING } from '../../theme';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { CounterInput } from '../CounterInput';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { PricingBreakdown } from '../../services/PricingService';
import { JobTemplate } from './JobTemplateSelector';

interface PayAndRequirementsSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  requirements: Record<string, boolean>;
  handleRequirementToggle: (key: string) => void;
  watchedOtherRequirement: string;
  pricingBreakdown?: PricingBreakdown | null;
  selectedTemplate?: JobTemplate | null;
}

const requirementsList = [
  { key: 'licensed', label: 'Licensed Security Guard' },
  { key: 'firstAid', label: 'First Aid Certified' },
  { key: 'firearms', label: 'Firearms License Required', tooltip: 'Requires guards to possess a valid firearms license and be authorized to carry on duty.' },
  { key: 'other', label: 'Other (Specify below)' },
];

const genderPrefs = [
  'No Preference', 'Male', 'Female', 'Other'
];

// Summary helper arguments type
interface PayAndRequirementsSummaryArgs {
  control: Control<any>;
  requirements: Record<string, boolean>;
  watchedOtherRequirement: string;
}

export function getPayAndRequirementsSummary({ control, requirements, watchedOtherRequirement }: PayAndRequirementsSummaryArgs): { label: string; value: string; }[] {
  return [
    { label: 'Num Guards', value: control?._formValues?.numGuards?.toString() || '0' },
    { label: 'Hourly Pay', value: control?._formValues?.hourlyPay || '' },
    { label: 'Gender Pref', value: control?._formValues?.genderPref || '' },
    { label: 'Requirements', value: Object.keys(requirements).filter(k => requirements[k]).join(', ') },
    { label: 'Other', value: watchedOtherRequirement || '' },
    { label: 'Uniform', value: control?._formValues?.uniform || '' },
    { label: 'Equipment', value: control?._formValues?.equipment || '' },
  ];
}

export const PayAndRequirementsSection: React.FC<PayAndRequirementsSectionProps> = React.memo(({
  control,
  errors,
  requirements,
  handleRequirementToggle,
  watchedOtherRequirement,
  pricingBreakdown,
  selectedTemplate,
}) => {
  // Local state for gender dropdown
  const [genderOpen, setGenderOpen] = useState(false);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Pay & Requirements</Text>
      <View>
        {/* Number of Guards and Hourly Pay */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Number of Guards</Text>
            <Controller
              control={control}
              name="numGuards"
              rules={{ required: true, min: 1 }}
              render={({ field: { onChange, value } }) => (
                <View style={{ height: 65 }}>
                  <CounterInput
                    value={value ?? 1}
                    onIncrement={() => onChange(Math.min(10, (value ?? 1) + 1))}
                    onDecrement={() => onChange(Math.max(1, (value ?? 1) - 1))}
                  />
                </View>
              )}
            />
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.sm }}>
            <Text style={styles.label}>Hourly Pay (per Guard)</Text>
            <View style={[styles.payInputContainer, { height: 50 }]}>
              <Text style={styles.currencySymbol}>$</Text>
              <Controller
                control={control}
                name="hourlyPay"
                rules={{
                  required: 'Hourly pay is required',
                  pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Enter a valid number (e.g., 25.00)' },
                  validate: v => parseFloat(v) >= 10 || 'Minimum $10.00 per hour',
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.payInput, errors.hourlyPay && styles.inputError]}
                    placeholder="25.00"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Dynamic Pricing Display */}
        {pricingBreakdown && selectedTemplate && (
          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>💡 Smart Pricing Recommendation</Text>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Recommended Rate:</Text>
              <Text style={styles.pricingValue}>${pricingBreakdown.totalHourlyRate.toFixed(2)}/hr</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Total Cost:</Text>
              <Text style={styles.pricingValue}>${pricingBreakdown.totalCost.toFixed(2)}</Text>
            </View>
            <Text style={styles.pricingNote}>
              Based on {selectedTemplate.title} template, location, and requirements
            </Text>
          </View>
        )}

        {/* Gender Preference */}
        <Text style={styles.subtitle}>Get guards quicker with higher hourly pay</Text>
        <Text style={styles.label}>Gender Preference</Text>
        <Controller
          control={control}
          name="genderPref"
          defaultValue={genderPrefs[0]}
          render={({ field: { onChange, value } }) => (
            <View style={styles.dropdownWrapper}>
              <Picker
                selectedValue={value}
                onValueChange={onChange}
                style={styles.picker}
              >
                {genderPrefs.map((pref) => (
                  <Picker.Item key={pref} label={pref} value={pref} />
                ))}
              </Picker>
            </View>
          )}
        />

        {/* Requirements */}
        <Text style={styles.label}>Requirements</Text>
        {requirementsList.map((req) => (
          <TouchableOpacity
            key={req.key}
            style={styles.checkboxRow}
            onPress={() => handleRequirementToggle(req.key)}
          >
            <View style={[styles.checkbox, requirements[req.key] && styles.checkboxChecked]}>
              {requirements[req.key] && <Feather name="check" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>{req.label}</Text>
            {req.tooltip && (
              <TouchableOpacity onPress={() => Alert.alert('Information', req.tooltip)}>
                <MaterialIcons name="info-outline" size={16} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {requirements.other && (
          <Controller
            control={control}
            name="otherRequirement"
            rules={{ required: 'Please specify your "Other" requirement.' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.otherRequirement && styles.inputError]}
                placeholder="E.g., Must have valid driver's license"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        )}

        {/* Uniform/Dress Code */}
        <Text style={styles.label}>Uniform/Dress Code</Text>
        <Controller
          control={control}
          name="uniform"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.uniform && styles.inputError]}
              placeholder="E.g., Black suit, White shirt, Tie"
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        {/* Equipment */}
        <Text style={styles.label}>Equipment Provided/Required</Text>
        <Controller
          control={control}
          name="equipment"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="E.g., Radios provided, Guard must bring flashlight"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
      </View>
      {/* Summary removed for transparent card layout */}
    </View>
  );
});

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: 'transparent',
    width: '100%',
    alignSelf: 'center',
    borderRadius: 12,
    padding: SPACING.md,
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
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.xs,
    fontSize: 15,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  payInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  currencySymbol: {
    fontSize: 15,
    color: COLORS.textDark,
    paddingLeft: SPACING.md,
  },
  payInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
    paddingRight: SPACING.md,
    paddingLeft: SPACING.xs,
    fontSize: 15,
  },
  dropdownWrapper: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    height: 70,
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING.md,
    zIndex: 1000,
  },
  dropDownContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 0.5,
    borderRadius: 8,
    zIndex: 1000,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  pricingCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  pricingTitle: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  pricingNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  picker: {
    width: '100%',
    height: 50,
  },
});
