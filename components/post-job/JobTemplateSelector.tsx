import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../theme';

const { width } = Dimensions.get('window');

export interface JobTemplate {
  id: string;
  title: string;
  description: string;
  subtext: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  defaultSettings: {
    title: string;
    description: string;
    venueType: string;
    hourlyPay: number;
    numGuards: number;
    requirements: string[];
    specialInstructions?: string;
  };
  pricing: {
    baseRate: number;
    requirementMultipliers: Record<string, number>;
    guardMultipliers: Record<number, number>;
  };
}

export const jobTemplates: JobTemplate[] = [
  {
    id: 'bar-security',
    title: 'Bar Security',
    description: 'Security for bars, pubs, and nightlife venues',
    subtext: 'Casual bar & pub crowd control',
    icon: 'local-bar',
    color: '#8B5CF6',
    defaultSettings: {
      title: 'Bar Security',
      description: 'Professional security services for bar/nightlife venue',
      venueType: 'Bar',
      hourlyPay: 25,
      numGuards: 2,
      requirements: ['licensed', 'firstAid'],
      specialInstructions: 'Experience with crowd control and alcohol-related incidents preferred'
    },
    pricing: {
      baseRate: 25,
      requirementMultipliers: {
        licensed: 1.2,
        firstAid: 1.1,
        firearms: 1.5
      },
      guardMultipliers: {
        1: 1.0,
        2: 0.95,
        3: 0.9,
        4: 0.85
      }
    }
  },
  {
    id: 'nightclub-security',
    title: 'Nightclub Security',
    description: 'High-energy nightclub and dance venue security',
    subtext: 'High-energy nightlife and venue safety',
    icon: 'nightlife',
    color: '#EC4899',
    defaultSettings: {
      title: 'Nightclub Security',
      description: 'Professional security for high-energy nightclub environment',
      venueType: 'Nightclub',
      hourlyPay: 30,
      numGuards: 3,
      requirements: ['licensed', 'firstAid'],
      specialInstructions: 'Must be comfortable in loud, crowded environments. Experience with VIP protection is a plus.'
    },
    pricing: {
      baseRate: 30,
      requirementMultipliers: {
        licensed: 1.2,
        firstAid: 1.1,
        firearms: 1.5
      },
      guardMultipliers: {
        1: 1.0,
        2: 0.95,
        3: 0.9,
        4: 0.85
      }
    }
  },
  {
    id: 'event-security',
    title: 'Event Security',
    description: 'Security for private events, parties, and celebrations',
    subtext: 'Private events and celebrations',
    icon: 'event',
    color: '#10B981',
    defaultSettings: {
      title: 'Event Security',
      description: 'Professional security for private events and celebrations',
      venueType: 'Private Event',
      hourlyPay: 22,
      numGuards: 2,
      requirements: ['licensed'],
      specialInstructions: 'Professional appearance required. May need to interact with guests.'
    },
    pricing: {
      baseRate: 22,
      requirementMultipliers: {
        licensed: 1.2,
        firstAid: 1.1,
        firearms: 1.4
      },
      guardMultipliers: {
        1: 1.0,
        2: 0.95,
        3: 0.9,
        4: 0.85
      }
    }
  },
  {
    id: 'concert-security',
    title: 'Concert Security',
    description: 'Security for concerts, festivals, and live music events',
    subtext: 'Concerts, festivals & live music',
    icon: 'music-note',
    color: '#F59E0B',
    defaultSettings: {
      title: 'Concert Security',
      description: 'Professional security for concerts and live music events',
      venueType: 'Concert',
      hourlyPay: 28,
      numGuards: 4,
      requirements: ['licensed', 'firstAid'],
      specialInstructions: 'Experience with large crowds and music events preferred. May need to handle crowd control.'
    },
    pricing: {
      baseRate: 28,
      requirementMultipliers: {
        licensed: 1.2,
        firstAid: 1.1,
        firearms: 1.4
      },
      guardMultipliers: {
        1: 1.0,
        2: 0.95,
        3: 0.9,
        4: 0.85
      }
    }
  },
  {
    id: 'corporate-security',
    title: 'Corporate Security',
    description: 'Security for corporate events, meetings, and business functions',
    subtext: 'Corporate events & business functions',
    icon: 'business',
    color: '#3B82F6',
    defaultSettings: {
      title: 'Corporate Security',
      description: 'Professional security for corporate events and business functions',
      venueType: 'Corporate',
      hourlyPay: 24,
      numGuards: 2,
      requirements: ['licensed'],
      specialInstructions: 'Professional appearance and demeanor required. May need to handle VIP guests.'
    },
    pricing: {
      baseRate: 24,
      requirementMultipliers: {
        licensed: 1.2,
        firstAid: 1.1,
        firearms: 1.3
      },
      guardMultipliers: {
        1: 1.0,
        2: 0.95,
        3: 0.9,
        4: 0.85
      }
    }
  },
  {
    id: 'custom-event',
    title: 'Custom Event',
    description: 'Create a custom security job with your specific requirements',
    subtext: 'Create your own custom security job',
    icon: 'add-circle-outline',
    color: '#6B7280',
    defaultSettings: {
      title: '',
      description: '',
      venueType: 'Other',
      hourlyPay: 20,
      numGuards: 1,
      requirements: [],
      specialInstructions: ''
    },
    pricing: {
      baseRate: 20,
      requirementMultipliers: {
        licensed: 1.2,
        firstAid: 1.1,
        firearms: 1.4
      },
      guardMultipliers: {
        1: 1.0,
        2: 0.95,
        3: 0.9,
        4: 0.85
      }
    }
  }
];

interface JobTemplateSelectorProps {
  navigation: any;
}

export const JobTemplateSelector: React.FC<JobTemplateSelectorProps> = ({ navigation }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);

  const handleTemplateSelect = (template: JobTemplate) => {
    setSelectedTemplate(template);
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      if (selectedTemplate.id === 'custom-event') {
        // Route to regular PostJob screen for custom events
        navigation.navigate('PostJob');
      } else {
        // Route to specialized PostJob screen for template-based jobs
        navigation.navigate('PostJobSpecialized', { selectedTemplate });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Job Type</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.templatesList}>
            {jobTemplates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.jobCard,
                  selectedTemplate?.id === template.id && styles.selectedCard
                ]}
                onPress={() => handleTemplateSelect(template)}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrapper}>
                  <MaterialIcons name={template.icon} size={20} color={COLORS.primary} />
                </View>
                
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle}>{template.title}</Text>
                  <Text style={styles.subtext}>{template.subtext}</Text>
                </View>
                
                <View style={styles.cardActions}>
                  {selectedTemplate?.id === template.id && (
                    <View style={styles.selectedIndicator}>
                      
                    </View>
                  )}
                  <MaterialIcons name="chevron-right" size={18} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Floating CTA Button */}
        {selectedTemplate && (
          <View style={styles.floatingCta}>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>
                Continue with '{selectedTemplate.title}'
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  templatesList: {
    gap: SPACING.sm,
  },
  jobCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: '#4F46E5',
    backgroundColor: '#F0F4FF',
  },
  iconWrapper: {
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedIndicator: {
    marginRight: 4,
  },
  floatingCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 