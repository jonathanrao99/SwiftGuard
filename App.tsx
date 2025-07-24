// @ts-nocheck
import React, { FC, lazy, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View, ActivityIndicator } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Toaster } from 'sonner-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { TabBarVisibilityProvider } from './components/TabBarVisibilityContext';
import CustomBottomNav from './components/CustomBottomNav';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Constants from 'expo-constants';

// Lazy load screens for better performance
const LoadingScreen = lazy(() => import('./screens/onboarding/LoadingScreen'));
const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const ClientDashboard = lazy(() => import('./screens/client/ClientDashboard'));
const ForgotPassword = lazy(() => import('./screens/ForgotPassword'));
const WelcomeScreen = lazy(() => import('./screens/onboarding/WelcomeScreen'));
const UserTypeSelection = lazy(() => import('./screens/UserTypeSelection'));
const SignUpClient = lazy(() => import('./screens/SignUpClient'));
const SignUpGuard = lazy(() => import('./screens/SignUpGuard'));
const PreferredPayment = lazy(() => import('./screens/PreferredPayment'));
const OtpVerification = lazy(() => import('./screens/OtpVerification'));
const PostJob = lazy(() => import('./screens/client/PostJob'));
const PostJobSpecialized = lazy(() => import('./screens/client/PostJobSpecialized'));
const PostJobTemplate = lazy(() => import('./screens/client/PostJobTemplate'));
const ProfileScreen = lazy(() => import('./screens/client/ProfileScreen'));
const OnboardingScreen = lazy(() => import('./screens/onboarding/OnboardingScreen'));
const GuardProfileScreen = lazy(() => import('./screens/client/GuardCardScreen'));
const FindGuardsScreen = lazy(() => import('./screens/client/FindGuardsScreen'));
const ReportsScreen = lazy(() => import('./screens/client/ReportsScreen'));
const JobsScreen = lazy(() => import('./screens/client/JobsScreen'));
const AllReviewsScreen = lazy(() => import('./screens/client/GuardReviews'));
const JobDetailsScreen = lazy(() => import('./screens/client/JobDetailsScreen'));
const LeaveReviewScreen = lazy(() => import('./screens/client/LeaveReviewScreen'));
const GuardTabs = lazy(() => import('./screens/guard/GuardTabs'));
const GuardJobDetailsScreen = lazy(() => import('./screens/guard/GuardJobDetailsScreen'));
const GuardMessagesScreen = lazy(() => import('./screens/guard/GuardMessagesScreen'));
const GuardChatScreen = lazy(() => import('./screens/guard/GuardChatScreen'));
const ReportIncidentScreen = lazy(() => import('./screens/guard/ReportIncidentScreen'));
const GuardEarningsScreen = lazy(() => import('./screens/guard/GuardEarningsScreen'));
const ClientReportsScreen = lazy(() => import('./screens/client/ClientReportsScreen'));
const TrackJobScreen = lazy(() => import('./screens/client/TrackJobScreen'));

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
      <Tab.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }} tabBar={props => <CustomBottomNav {...props} />}>
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
  // Get Stripe key from environment variables
  const extra = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra;
  const STRIPE_PUBLIC_KEY = extra?.STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <AuthProvider>
              <StripeProvider publishableKey={STRIPE_PUBLIC_KEY || 'pk_test_51R5tBA05xKnpNtzd6cGTTNnKLlOYPKdFaiJcXAtMHCWNpTSOv7FYwgMYhoNfIBSM27GXDFVoDCNkLGgcMkHclbhj00y61WpU98'}>
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
                    name="GuardEarnings" 
                    component={GuardEarningsScreen} 
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
                    name="PostJobTemplate" 
                    component={PostJobTemplate} 
                    options={{ headerShown: false }} 
                  />
                  <Stack.Screen 
                    name="FindGuards" 
                    component={FindGuardsScreen} 
                    options={{ headerShown: false }} 
                  />
                  <Stack.Screen 
                    name="LiveTracking" 
                    component={LiveTrackingScreen} 
                    options={{ headerShown: false }} 
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </StripeProvider>
          </AuthProvider>
        </BottomSheetModalProvider>
        <Toast />
        <Toaster />
      </GestureHandlerRootView>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
