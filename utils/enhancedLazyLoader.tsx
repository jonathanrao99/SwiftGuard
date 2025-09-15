import React, { ComponentType, Suspense, lazy } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../theme';

interface LazyLoaderOptions {
  fallback?: ComponentType;
  errorBoundary?: boolean;
  preload?: boolean;
  retryCount?: number;
  timeout?: number;
}

interface LazyComponentProps {
  [key: string]: any;
}

// Enhanced loading fallback component
const DefaultFallback = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={{
      marginTop: 10,
      color: COLORS.textPrimary,
      fontSize: 16,
    }}>
      Loading...
    </Text>
  </View>
);

// Error boundary component for lazy loaded components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; retry: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; retry: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyLoader Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.background,
          padding: 20,
        }}>
          <Text style={{
            color: COLORS.error || '#FF4444',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 10,
          }}>
            Failed to load screen
          </Text>
          <Text style={{
            color: COLORS.textPrimary,
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 20,
          }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    return this.props.children;
  }
}

// Enhanced lazy loader with retry mechanism
const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoaderOptions = {}
): ComponentType<LazyComponentProps> => {
  const {
    fallback: Fallback = DefaultFallback,
    errorBoundary = true,
    retryCount = 3,
    timeout = 10000,
  } = options;

  let retryAttempts = 0;

  const retryImport = (): Promise<{ default: T }> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Import timeout after ${timeout}ms`));
      }, timeout);

      importFn()
        .then((module) => {
          clearTimeout(timeoutId);
          resolve(module);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          retryAttempts++;
          
          if (retryAttempts < retryCount) {
            console.warn(`Lazy import failed, retrying (${retryAttempts}/${retryCount}):`, error);
            setTimeout(() => {
              retryImport().then(resolve).catch(reject);
            }, 1000 * retryAttempts); // Exponential backoff
          } else {
            reject(new Error(`Failed to load component after ${retryCount} attempts: ${error.message}`));
          }
        });
    });
  };

  const LazyComponent = lazy(() => retryImport());

  const EnhancedLazyComponent: ComponentType<LazyComponentProps> = (props) => {
    const RetryWrapper = () => {
      const [key, setKey] = React.useState(0);
      
      const handleRetry = () => {
        setKey(prev => prev + 1);
      };

      const content = (
        <Suspense fallback={<Fallback />}>
          <LazyComponent {...props} key={key} />
        </Suspense>
      );

      if (errorBoundary) {
        return (
          <LazyErrorBoundary retry={handleRetry}>
            {content}
          </LazyErrorBoundary>
        );
      }

      return content;
    };

    return <RetryWrapper />;
  };

  return EnhancedLazyComponent;
};

// Smart preloader that handles errors gracefully
export class SmartPreloader {
  private preloadedComponents = new Map<string, Promise<any>>();
  private preloadQueue = new Set<string>();

  async preloadComponent(name: string, importFn: () => Promise<any>): Promise<void> {
    if (this.preloadedComponents.has(name) || this.preloadQueue.has(name)) {
      return;
    }

    this.preloadQueue.add(name);

    try {
      const promise = importFn();
      this.preloadedComponents.set(name, promise);
      
      await promise;
      console.log(`✅ Preloaded component: ${name}`);
    } catch (error) {
      console.warn(`❌ Failed to preload ${name}:`, error);
      this.preloadedComponents.delete(name);
    } finally {
      this.preloadQueue.delete(name);
    }
  }

  async preloadComponents(components: Array<{ name: string; importFn: () => Promise<any> }>): Promise<void> {
    const preloadPromises = components.map(({ name, importFn }) =>
      this.preloadComponent(name, importFn).catch(error => 
        console.warn(`Failed to preload ${name}:`, error)
      )
    );

    await Promise.allSettled(preloadPromises);
  }

  isPreloaded(name: string): boolean {
    return this.preloadedComponents.has(name);
  }

  getPreloadedComponent(name: string): Promise<any> | undefined {
    return this.preloadedComponents.get(name);
  }
}

export const smartPreloader = new SmartPreloader();

export default createLazyComponent;
