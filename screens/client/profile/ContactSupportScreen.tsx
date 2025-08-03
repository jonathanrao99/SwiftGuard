import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../../theme';
import { NavigationProps } from '../../../types';

interface ContactSupportScreenProps {
  navigation: NavigationProps;
}

interface SupportOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
}

export default function ContactSupportScreen({ navigation }: ContactSupportScreenProps) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [message, setMessage] = useState('');

  const supportOptions: SupportOption[] = [
    {
      id: '2',
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      icon: 'email',
      action: () => navigation.navigate('EmailSupport'),
    },
    {
      id: '3',
      title: 'Phone Support',
      description: 'Call us directly for immediate assistance',
      icon: 'phone',
      action: () => {
        Alert.alert('Phone Support', 'Call us at: +1 (555) 123-4567');
      },
    },
    {
      id: '4',
      title: 'FAQ',
      description: 'Find answers to common questions',
      icon: 'help',
      action: () => navigation.navigate('FAQ'),
    },
  ];

  const topics = [
    'Account Issues',
    'Payment Problems',
    'Job Posting Help',
    'Guard Assignment',
    'Technical Support',
    'Billing Questions',
    'Other',
  ];

  const handleSubmitTicket = () => {
    if (!selectedTopic || !message.trim()) {
      Alert.alert('Error', 'Please select a topic and enter your message.');
      return;
    }

    Alert.alert(
      'Support Ticket Submitted',
      'Thank you for contacting us. We\'ll get back to you within 24 hours.',
      [
        {
          text: 'OK',
          onPress: () => {
            setSelectedTopic('');
            setMessage('');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderSupportOption = (option: SupportOption) => (
    <TouchableOpacity
      key={option.id}
      style={styles.supportCard}
      onPress={option.action}
    >
      <View style={styles.supportIconContainer}>
        <MaterialIcons name={option.icon as any} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.supportInfo}>
        <Text style={styles.supportTitle}>{option.title}</Text>
        <Text style={styles.supportDescription}>{option.description}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Quick Support Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Help Quickly</Text>
            {supportOptions.map(renderSupportOption)}
          </View>

          {/* Submit Support Ticket */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit Support Ticket</Text>
            
            <View style={styles.ticketCard}>
              <Text style={styles.label}>Select Topic</Text>
              <View style={styles.topicContainer}>
                {topics.map((topic) => (
                  <TouchableOpacity
                    key={topic}
                    style={[
                      styles.topicChip,
                      selectedTopic === topic && styles.topicChipActive
                    ]}
                    onPress={() => setSelectedTopic(topic)}
                  >
                    <Text style={[
                      styles.topicChipText,
                      selectedTopic === topic && styles.topicChipTextActive
                    ]}>
                      {topic}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Message</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={COLORS.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmitTicket}
              >
                <MaterialIcons name="send" size={20} color={COLORS.white} />
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.contactCard}>
              <View style={styles.contactItem}>
                <MaterialIcons name="phone" size={20} color={COLORS.primary} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>+1 (555) 123-4567</Text>
                </View>
              </View>
              
              <View style={styles.contactItem}>
                <MaterialIcons name="email" size={20} color={COLORS.primary} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>support@swiftguard.com</Text>
                </View>
              </View>
              
              <View style={styles.contactItem}>
                <MaterialIcons name="schedule" size={20} color={COLORS.primary} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Hours</Text>
                  <Text style={styles.contactValue}>24/7 Support Available</Text>
                </View>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  container: { 
    flex: 1, 
    backgroundColor: COLORS.backgroundLight 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.sm * 1.2 : SPACING.xl * 1.2,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: COLORS.textDark 
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  contactInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  supportDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ticketCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  topicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  topicChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topicChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  topicChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  topicChipTextActive: {
    color: COLORS.white,
  },
  messageInput: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    minHeight: 120,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },

  emergencyCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningLight,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  emergencyInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: SPACING.xs,
  },
  emergencyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
}); 