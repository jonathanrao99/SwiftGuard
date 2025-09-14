import React, { lazy, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View, ActivityIndicator } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
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
<<<<<<< HEAD
import { initializeMonitoring } from './utils/monitoringSetup';
import NotificationService from './services/NotificationService';
=======
>>>>>>> parent of c623858 (Enhance app configuration and payment functions: Updated app.config.js to include expo-font plugin, improved App.tsx with monitoring initialization, and refined metro.config.js for better module resolution. Enhanced Supabase functions with TypeScript interfaces for better type safety and error handling in payment methods and setup intent functions.)

// Lazy load screens for better performance
const LoadingScreen = lazy(() => import('./screens/onboarding/LoadingScreen'));
const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const ClientDashboard = lazy(() => import('./screens/client/home/ClientDashboard'));
const ForgotPassword = lazy(() => import('./screens/ForgotPassword'));
const WelcomeScreen = lazy(() => import('./screens/onboarding/WelcomeScreen'));
const UserTypeSelection = lazy(() => import('./screens/UserTypeSelection'));
const SignUpClient = lazy(() => import('./screens/SignUpClient'));

const SignUpGuard = lazy(() => import('./screens/SignUpGuard'));
const PreferredPayment = lazy(() => import('./screens/PreferredPayment'));
const OtpVerification = lazy(() => import('./screens/OtpVerification'));
const PostJob = lazy(() => import('./screens/client/home/PostJob'));
const PostJobSpecialized = lazy(() => import('./screens/client/home/PostJobSpecialized'));
const JobPostedSuccessScreen = lazy(() => import('./screens/client/home/JobPostedSuccessScreen'));
const JobTemplateSelector = lazy(() => import('./components/post-job/JobTemplateSelector').then(module => ({ default: module.JobTemplateSelector })));
const ProfileScreen = lazy(() => import('./screens/client/profile/ProfileScreen'));
const OnboardingScreen = lazy(() => import('./screens/onboarding/OnboardingScreen'));
const GuardProfileScreen = lazy(() => import('./screens/client/jobs/GuardCardScreen'));
const FindGuardsScreen = lazy(() => import('./screens/client/home/FindGuardsScreen'));
const ReportsScreen = lazy(() => import('./screens/client/home/ReportsScreen'));
const JobsScreen = lazy(() => import('./screens/client/jobs/JobsScreen'));
const AllReviewsScreen = lazy(() => import('./screens/client/jobs/GuardReviews').then(module => ({ default: module.default })));
const JobDetailsScreen = lazy(() => import('./screens/client/jobs/JobDetailsScreen'));
const LeaveReviewScreen = lazy(() => import('./screens/client/jobs/LeaveReviewScreen'));
const GuardTabs = lazy(() => import('./screens/guard/GuardTabs'));
const GuardJobDetailsScreen = lazy(() => import('./screens/guard/GuardJobDetailsScreen'));
const GuardMessagesScreen = lazy(() => import('./screens/guard/GuardMessagesScreen'));
const GuardChatScreen = lazy(() => import('./screens/guard/GuardChatScreen'));
const ReportIncidentScreen = lazy(() => import('./screens/guard/ReportIncidentScreen'));
const CheckInScreen = lazy(() => import('./screens/guard/CheckInScreen'));
const GuardMode = lazy(() => import('./screens/guard/GuardMode'));
const EarningsScreen = lazy(() => import('./screens/guard/EarningsScreen'));
const ClientReportsScreen = lazy(() => import('./screens/client/jobs/ClientReportsScreen'));
const TrackJobScreen = lazy(() => import('./screens/client/home/TrackJobScreen'));

// Profile subpages
const PersonalInfoScreen = lazy(() => import('./screens/client/profile/PersonalInfoScreen'));
const AccountScreen = lazy(() => import('./screens/client/profile/AccountScreen'));
const MySecurityJobsScreen = lazy(() => import('./screens/client/profile/MySecurityJobsScreen'));
const PaymentMethodsScreen = lazy(() => import('./screens/client/profile/PaymentMethodsScreen'));
const AddPaymentMethodScreen = lazy(() => import('./screens/client/profile/AddPaymentMethodScreen'));
const ContactSupportScreen = lazy(() => import('./screens/client/profile/ContactSupportScreen'));

// Notification screens
const NotificationCenterScreen = lazy(() => import('./screens/client/profile/NotificationCenterScreen'));
const NotificationPreferencesScreen = lazy(() => import('./screens/client/profile/NotificationPreferencesScreen'));
const NotificationTestScreen = lazy(() => import('./screens/client/profile/NotificationTestScreen'));

// Payment screens
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

function ClientTabs() {
  return (
    <TabBarVisibilityProvider>
      <Tab.Navigator 
        initialRouteName="Home" 
        screenOptions={{ 
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default tab bar since we use CustomBottomNav
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
<<<<<<< HEAD
  // Initialize monitoring system
  React.useEffect(() => {
    initializeMonitoring().catch(console.error);
  }, []);

  // Initialize notification service
  React.useEffect(() => {
    NotificationService.initialize().catch(console.error);
    
    // Cleanup on unmount
    return () => {
      NotificationService.cleanup();
    };
  }, []);

=======
>>>>>>> parent of c623858 (Enhance app configuration and payment functions: Updated app.config.js to include expo-font plugin, improved App.tsx with monitoring initialization, and refined metro.config.js for better module resolution. Enhanced Supabase functions with TypeScript interfaces for better type safety and error handling in payment methods and setup intent functions.)
  // Get Stripe key from environment variables
  const extra = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra;
  const STRIPE_PUBLIC_KEY = extra?.STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY;

  return (
    <ErrorBoundary>
      <GluestackUIProvider config={gluestackUIConfig}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <AuthProvider>
                <StripeProvider publishableKey={STRIPE_PUBLIC_KEY || 'pk_test_51R5tBA05xKnpNtzd6cGTTNnKLlOYPKdFaiJcXAtMHCWNpTSOv7FYwgMYhoNfIBSM27GXDFVoDCNkLGgcMkHclbhj00y61WpU98'}>
                  <ToastProvider>
                    <NavigationContainer>
                  <Stack.Navigator initialRouteName="Loading" screenOptions={{ headerShown: false }}>
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
                      component={OtpVerification} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="PreferredPayment" 
                      component={PreferredPayment} 
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
                      component={AllReviewsScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="JobDetails" 
                      component={JobDetailsScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="LeaveReview" 
                      component={LeaveReviewScreen} 
                      options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                      name="TrackJob" 
                      component={TrackJobScreen} 
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
                      component={GuardJobDetailsScreen} 
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
                      component={GuardMode} 
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
          component={PostJobSpecialized}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="JobTemplateSelector"
          component={JobTemplateSelector}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="JobPostedSuccess"
          component={JobPostedSuccessScreen}
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
                    </NavigationContainer>
                  </ToastProvider>
                </StripeProvider>
              </AuthProvider>
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </GluestackUIProvider>
    </ErrorBoundary>
  );
}
