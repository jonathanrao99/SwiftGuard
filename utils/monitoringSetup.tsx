import React from 'react';
import { productionMonitoring } from './productionMonitoring';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../supabaseClient';

/**
 * Initialize production monitoring system
 */
export const initializeMonitoring = async () => {
  try {
    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Initialize monitoring with user context
    productionMonitoring.init(user?.id);
    
    // Set up network change listener for offline sync
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        productionMonitoring.syncOfflineData();
      }
    });

    // Track app launch
    await productionMonitoring.trackEvent('app_launched', {
      platform: 'mobile',
      version: '1.0.0'
    });

    console.log('✅ Monitoring system initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize monitoring:', error);
  }
};

/**
 * Enhanced error boundary with monitoring
 */
export const withMonitoring = (Component: React.ComponentType<any>) => {
  return function MonitoredComponent(props: any) {
    React.useEffect(() => {
      // Track screen view
      const screenName = Component.displayName || Component.name || 'Unknown';
      productionMonitoring.setCurrentScreen(screenName);
      productionMonitoring.trackEvent('screen_view', { screen: screenName });
    }, []);

    return <Component {...props} />;
  };
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitoring = (screenName: string) => {
  React.useEffect(() => {
    const timer = productionMonitoring.createPerformanceTimer(`${screenName}_load_time`);
    
    return () => {
      timer.end();
    };
  }, [screenName]);

  return {
    trackAction: (actionName: string, metadata?: any) => {
      productionMonitoring.trackEvent(`${screenName}_${actionName}`, metadata);
    },
    trackError: (error: Error | string, context?: any) => {
      productionMonitoring.trackError(error, { screen: screenName, ...context });
    }
  };
};

export default productionMonitoring;
