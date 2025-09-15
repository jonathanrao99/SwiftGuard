/**
 * Button Optimization Utilities
 * Provides optimized button handling to reduce delays and improve responsiveness
 */

import { InteractionManager, LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Optimized button press handler that ensures smooth transitions
 */
export const createOptimizedButtonHandler = (handler: () => void | Promise<void>) => {
  return async () => {
    // Use InteractionManager to ensure UI updates are prioritized
    InteractionManager.runAfterInteractions(() => {
      // Configure instant layout animation for immediate feedback
      LayoutAnimation.configureNext({
        duration: 100,
        create: { type: 'easeInEaseOut', property: 'opacity' },
        update: { type: 'easeInEaseOut', property: 'opacity' },
        delete: { type: 'easeInEaseOut', property: 'opacity' },
      });
      
      // Execute the handler
      handler();
    });
  };
};

/**
 * Optimized navigation handler with immediate feedback
 */
export const createOptimizedNavigationHandler = (
  navigation: any,
  screenName: string,
  params?: any
) => {
  return createOptimizedButtonHandler(() => {
    // Provide immediate visual feedback
    LayoutAnimation.configureNext({
      duration: 50,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut', property: 'opacity' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    
    // Navigate with optimized timing
    navigation.navigate(screenName, params);
  });
};

/**
 * Debounced button handler to prevent rapid successive presses
 */
export const createDebouncedHandler = (
  handler: () => void | Promise<void>,
  delay: number = 100
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      handler();
      timeoutId = null;
    }, delay);
  };
};

/**
 * Optimized async button handler with loading state
 */
export const createAsyncButtonHandler = (
  handler: () => Promise<void>,
  setLoading?: (loading: boolean) => void
) => {
  return async () => {
    if (setLoading) {
      setLoading(true);
    }
    
    try {
      // Use InteractionManager to ensure smooth UI updates
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          resolve();
        });
      });
      
      await handler();
    } finally {
      if (setLoading) {
        setLoading(false);
      }
    }
  };
};

/**
 * Preload screen data for faster navigation
 */
export const preloadScreenData = async (screenName: string, dataLoader: () => Promise<any>) => {
  try {
    // Preload data in the background
    const data = await dataLoader();
    
    // Cache the data for immediate access
    // This could be stored in a context, Redux store, or AsyncStorage
    return data;
  } catch (error) {
    console.warn(`Failed to preload data for ${screenName}:`, error);
    return null;
  }
};

/**
 * Optimize touch feedback for better responsiveness
 */
export const createTouchFeedback = () => {
  return {
    activeOpacity: 0.7,
    underlayColor: 'rgba(0,0,0,0.1)',
  };
};

/**
 * Performance monitoring for button interactions
 */
export const measureButtonPerformance = (action: string, handler: () => void) => {
  const startTime = Date.now();
  
  const wrappedHandler = () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration > 100) {
      console.warn(`Slow button interaction detected: ${action} took ${duration}ms`);
    }
    
    handler();
  };
  
  return wrappedHandler;
};
