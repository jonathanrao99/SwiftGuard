import React, { lazy, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View, ActivityIndicator } from 'react-native';
// Conditionally import Stripe for native platforms only
let StripeProvider: any = null;
if (Platform.OS !== 'web') {
  try {
    const StripeModule = require('@stripe/stripe-react-native');
    StripeProvider = StripeModule.StripeProvider;
  } catch (error) {
    console.warn('Stripe module not available for this platform');
  }
}

// Wrapper component for conditional Stripe rendering
const AppWrapper: React.FC<{ children: React.ReactNode; stripeKey: string }> = ({ children, stripeKey }) => {
  if (StripeProvider) {
    return <StripeProvider publishableKey={stripeKey}>{children}</StripeProvider>;
  }
  return <>{children}</>;
};
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './components/ui/toast';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { gluestackUIConfig } from './theme/gluestack-config';
import { TabBarVisibilityProvider } from './components/TabBarVisibilityContext';
import CustomBottomNav from './components/CustomBottomNav';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Constants from 'expo-constants';
import { initializeMonitoring } from './utils/monitoringSetup';
import NotificationService from './services/NotificationService';

// Import all screens directly for faster initial load
import LoadingScreen from './screens/onboarding/LoadingScreen';
import LoginScreen from './screens/LoginScreen';
import ClientDashboard from './screens/client/home/ClientDashboard';
import UserTypeSelection from './screens/UserTypeSelection';
import ProfileScreen from './screens/client/profile/ProfileScreen';
// Lazy load non-critical screens to prevent circular dependencies
const ForgotPassword = lazy(() => import('./screens/ForgotPassword'));
const WelcomeScreen = lazy(() => import('./screens/onboarding/WelcomeScreen'));
const SignUpClient = lazy(() => import('./screens/SignUpClient'));
const SignUpGuard = lazy(() => import('./screens/SignUpGuard'));
const PreferredPayment = lazy(() => import('./screens/PreferredPayment'));
const OtpVerification = lazy(() => import('./screens/OtpVerification'));
const GuardTabs = lazy(() => import('./screens/guard/GuardTabs'));
const PostJob = lazy(() => import('./screens/client/home/PostJob'));
const PostJobSpecialized = lazy(() => import('./screens/client/home/PostJobSpecialized'));
const JobPostedSuccessScreen = lazy(() => import('./screens/client/home/JobPostedSuccessScreen'));
const JobTemplateSelector = lazy(() => import('./components/post-job/JobTemplateSelector').then(module => ({ default: module.JobTemplateSelector })));
const OnboardingScreen = lazy(() => import('./screens/onboarding/OnboardingScreen'));
const GuardProfileScreen = lazy(() => import('./screens/client/jobs/GuardCardScreen'));
const FindGuardsScreen = lazy(() => import('./screens/client/home/FindGuardsScreen'));
const ReportsScreen = lazy(() => import('./screens/client/home/ReportsScreen'));
const JobsScreen = lazy(() => import('./screens/client/jobs/JobsScreen'));
const AllReviewsScreen = lazy(() => import('./screens/client/jobs/GuardReviews'));
const JobDetailsScreen = lazy(() => import('./screens/client/jobs/JobDetailsScreen'));
const LeaveReviewScreen = lazy(() => import('./screens/client/jobs/LeaveReviewScreen'));
const GuardJobDetailsScreen = lazy(() => import('./screens/guard/GuardJobDetailsScreen'));
const GuardMessagesScreen = lazy(() => import('./screens/guard/GuardMessagesScreen'));
const GuardChatScreen = lazy(() => import('./screens/guard/GuardChatScreen'));
const ReportIncidentScreen = lazy(() => import('./screens/guard/ReportIncidentScreen'));
const CheckInScreen = lazy(() => import('./screens/guard/CheckInScreen'));
const GuardMode = lazy(() => import('./screens/guard/GuardMode'));
const EarningsScreen = lazy(() => import('./screens/guard/EarningsScreen'));
const ClientReportsScreen = lazy(() => import('./screens/client/jobs/ClientReportsScreen'));
const TrackJobScreen = lazy(() => import('./screens/client/home/TrackJobScreen'));

// Profile subpages - lazy loaded
const PersonalInfoScreen = lazy(() => import('./screens/client/profile/PersonalInfoScreen'));
const AccountScreen = lazy(() => import('./screens/client/profile/AccountScreen'));
const MySecurityJobsScreen = lazy(() => import('./screens/client/profile/MySecurityJobsScreen'));
const PaymentMethodsScreen = lazy(() => import('./screens/client/profile/PaymentMethodsScreen'));
const AddPaymentMethodScreen = lazy(() => import('./screens/client/profile/AddPaymentMethodScreen'));
const ContactSupportScreen = lazy(() => import('./screens/client/profile/ContactSupportScreen'));

// Notification screens - lazy loaded
const NotificationCenterScreen = lazy(() => import('./screens/client/profile/NotificationCenterScreen'));
const NotificationPreferencesScreen = lazy(() => import('./screens/client/profile/NotificationPreferencesScreen'));

// Payment screens - lazy loaded
const PaymentHistoryScreen = lazy(() => import('./screens/client/profile/PaymentHistoryScreen'));

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Enable screens for better performance
enableScreens(true);

// Loading component for lazy-loaded screens
const ScreenLoader: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <ActivityIndicator size="large" color="#2563eb" />
  </View>
);

// Wrapper component for lazy-loaded screens
const LazyScreenWrapper: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <Suspense fallback={<ScreenLoader />}>
    {children}
  </Suspense>
);

function ClientTabs() {
  return (
    <TabBarVisibilityProvider>
      <Tab.Navigator 
        initialRouteName="Home" 
        screenOptions={{ 
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default tab bar since we use CustomBottomNav
          lazy: false, // Disable lazy loading completely for instant switching
        }} 
        tabBar={props => <CustomBottomNav {...props} />}
      >
        <Tab.Screen 
          name="Home" 
          component={ClientDashboard} 
          options={{ 
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size, focused }) => <MaterialIcons name="dashboard" size={size} color={color} />
          }} 
        />
        <Tab.Screen 
          name="Jobs" 
          component={JobsScreen} 
          options={{ tabBarLabel: 'Jobs', tabBarIcon: ({ color, size, focused }) => <MaterialIcons name="work" size={size} color={color} /> }} 
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ 
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size, focused }) => <FontAwesome name="user" size={size} color={color} />
          }} 
        />
      </Tab.Navigator>
    </TabBarVisibilityProvider>
  );
}

export default function App() {
  // Initialize monitoring system
  React.useEffect(() => {
    initializeMonitoring().catch((error) => {
      // Log error through proper logging service
    });
    
    // All screens are now imported directly for faster initial load
    if (__DEV__) {
      // All screens loaded directly for optimal performance
    }
  }, []);

  // Initialize notification service
  React.useEffect(() => {
    NotificationService.initialize().catch((error) => {
      // Log error through proper logging service
    });
    
    // Cleanup on unmount
    return () => {
      NotificationService.cleanup();
    };
  }, []);

  // All screens are now imported directly for instant navigation

  // Get Stripe key from environment variables - SECURITY: No fallback to prevent hardcoded keys
  const extra = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra;
  const STRIPE_PUBLIC_KEY = extra?.STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY;

  // SECURITY: Fail fast if Stripe key is missing
  if (!STRIPE_PUBLIC_KEY) {
    throw new Error('STRIPE_PUBLIC_KEY is required. Please check your environment variables.');
  }

  return (
    <ErrorBoundary>
      <GluestackUIProvider config={gluestackUIConfig}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <AuthProvider>
                <AppWrapper stripeKey={STRIPE_PUBLIC_KEY}>
                  <ToastProvider>
                    <NavigationContainer>
                      <Suspense fallback={<ScreenLoader />}>
                        <Stack.Navigator
                    initialRouteName="Loading" 
                    screenOptions={{ 
                      headerShown: false,
                      animationTypeForReplace: 'push',
                      gestureEnabled: false, // Disable gestures for smoother fade
                      cardStyleInterpolator: ({ current }) => {
                        return {
                          cardStyle: {
                            opacity: current.progress,
                          },
                        };
                      },
                      transitionSpec: {
                        open: {
                          animation: 'timing',
                          config: {
                            duration: 150, // Faster transitions
                          },
                        },
                        close: {
                          animation: 'timing',
                          config: {
                            duration: 100, // Faster transitions
                          },
                        },
                      },
                    }}
                  >
                    <Stack.Screen 
                      name="Loading" 
                      component={LoadingScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="Onboarding" 
                      component={OnboardingScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="Welcome" 
                      component={WelcomeScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="UserTypeSelection" 
                      component={UserTypeSelection} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="SignUpClient" 
                      component={SignUpClient} 
                      options={{ headerShown: false }} 
                    />

                    <Stack.Screen 
                      name="OtpVerification" 
                      component={OtpVerification as any} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="PreferredPayment" 
                      component={PreferredPayment as any} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="SignUpGuard" 
                      component={SignUpGuard} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="Login" 
                      component={LoginScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="ForgotPassword" 
                      component={ForgotPassword} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="Client" 
                      component={ClientTabs} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="AllReviews" 
                      component={AllReviewsScreen as any} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="JobDetails" 
                      component={JobDetailsScreen as any} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="LeaveReview" 
                      component={LeaveReviewScreen as any} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="TrackJob" 
                      component={TrackJobScreen as any} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="Reports" 
                      component={ReportsScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="ClientReports" 
                      component={ClientReportsScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="GuardProfile" 
                      component={GuardProfileScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="SecurityDashboard" 
                      component={GuardTabs} 
                      options={{ title: 'Security Dashboard' }} 
                    />
                    <Stack.Screen 
                      name="GuardTabs" 
                      component={GuardTabs} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="GuardJobDetails" 
                      component={GuardJobDetailsScreen as any} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="GuardMessages" 
                      component={GuardMessagesScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="GuardChat" 
                      component={GuardChatScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="ReportIncident" 
                      component={ReportIncidentScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="CheckIn" 
                      component={CheckInScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="GuardMode" 
                      component={GuardMode as any} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="Earnings" 
                      component={EarningsScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="PostJob" 
                      component={PostJob} 
                      options={{ headerShown: false }} 
                    />
                            <Stack.Screen
          name="PostJobSpecialized"
          component={PostJobSpecialized as any}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="JobTemplateSelector"
          component={JobTemplateSelector}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="JobPostedSuccess"
          component={JobPostedSuccessScreen as any}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="FindGuards" 
          component={FindGuardsScreen} 
          options={{ headerShown: false }} 
        />
                    
                    {/* Profile Subpages */}
                    <Stack.Screen 
                      name="PersonalInfo" 
                      component={PersonalInfoScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="Account" 
                      component={AccountScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="MySecurityJobs" 
                      component={MySecurityJobsScreen} 
                      options={{ headerShown: false }} 
                    />
                            <Stack.Screen
          name="PaymentMethods"
          component={PaymentMethodsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddPaymentMethod"
          component={AddPaymentMethodScreen}
          options={{ headerShown: false }}
        />
                <Stack.Screen
          name="ContactSupport"
          component={ContactSupportScreen}
          options={{ headerShown: false }}
        />
        
        {/* Notification screens */}
        <Stack.Screen
          name="NotificationCenter"
          component={NotificationCenterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NotificationPreferences"
          component={NotificationPreferencesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NotificationTest"
          component={NotificationTestScreen}
          options={{ headerShown: false }}
        />
        
        {/* Payment screens */}
        <Stack.Screen
          name="PaymentHistory"
          component={PaymentHistoryScreen}
          options={{ headerShown: false }}
        />
                        </Stack.Navigator>
                      </Suspense>
                    </NavigationContainer>
                  </ToastProvider>
                </AppWrapper>
              </AuthProvider>
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </GluestackUIProvider>
    </ErrorBoundary>
  );
}
