import React, { Suspense } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../theme';
import ErrorBoundary from '../../../components/ErrorBoundary';

// Lazy load Lottie for better performance
const LottieView = React.lazy(() => import('lottie-react-native'));

interface JobPostedSuccessScreenProps {
  navigation: any;
  route: {
    params: {
      jobDetails?: any;
    };
  };
}

const JobPostedSuccessScreen: React.FC<JobPostedSuccessScreenProps> = ({ navigation, route }) => {
  const { jobDetails } = route.params || {};

  const handleViewJobs = () => {
    navigation.navigate('Jobs');
  };

  const handlePostAnotherJob = () => {
    navigation.navigate('JobTemplateSelector');
  };

  const handleGoHome = () => {
    navigation.navigate('ClientDashboard');
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoHome}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Posted</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation */}
        <View style={styles.successAnimationContainer}>
          <Suspense fallback={
            <View style={styles.lottieAnimation}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          }>
            <LottieView
              source={require('../../../assets/success.json')}
              autoPlay
              loop={false}
              style={styles.lottieAnimation}
            />
          </Suspense>
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.successTitle}>Job Posted Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Your security job has been posted and is now visible to guards. 
            You'll receive notifications when guards apply.
          </Text>
        </View>

        {/* Job Details Card */}
        {jobDetails && (
          <View style={styles.jobDetailsCard}>
            <Text style={styles.jobDetailsTitle}>Job Details</Text>
            <View style={styles.jobDetailRow}>
              <Text style={styles.jobDetailLabel}>Title:</Text>
              <Text style={styles.jobDetailValue}>{jobDetails.title}</Text>
            </View>
            <View style={styles.jobDetailRow}>
              <Text style={styles.jobDetailLabel}>Location:</Text>
              <Text style={styles.jobDetailValue}>{jobDetails.location}</Text>
            </View>
            <View style={styles.jobDetailRow}>
              <Text style={styles.jobDetailLabel}>Pay:</Text>
              <Text style={styles.jobDetailValue}>${jobDetails.pay}/hr</Text>
            </View>
            <View style={styles.jobDetailRow}>
              <Text style={styles.jobDetailLabel}>Guards Needed:</Text>
              <Text style={styles.jobDetailValue}>{jobDetails.num_guards}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewJobs}
          >
            <LinearGradient 
              colors={["#2563eb", "#6366f1"]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.gradientButton}
            >
              <MaterialIcons name="work" size={20} color="white" />
              <Text style={styles.buttonText}>View My Jobs</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePostAnotherJob}
          >
            <LinearGradient 
              colors={["#059669", "#10B981"]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.gradientButton}
            >
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={styles.buttonText}>Post Another Job</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips for Better Results</Text>
          <View style={styles.tipItem}>
            <MaterialIcons name="star" size={16} color={COLORS.primary} />
            <Text style={styles.tipText}>Be specific about requirements and expectations</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="star" size={16} color={COLORS.primary} />
            <Text style={styles.tipText}>Offer competitive pay to attract quality guards</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="star" size={16} color={COLORS.primary} />
            <Text style={styles.tipText}>Respond quickly to guard applications</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  successAnimationContainer: {
    marginTop: SPACING.xl * 2,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  jobDetailsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  jobDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  jobDetailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  jobDetailValue: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  actionButtons: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: SPACING.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});

export default JobPostedSuccessScreen; 