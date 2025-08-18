import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onPress?: () => void;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastContextType {
  show: (config: Omit<ToastConfig, 'id'>) => void;
  hide: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

const { width } = Dimensions.get('window');

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const show = (config: Omit<ToastConfig, 'id'>) => {
    const id = Date.now().toString();
    const newToast: ToastConfig = {
      id,
      duration: 4000,
      ...config,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-hide after duration
    setTimeout(() => {
      hide(id);
    }, newToast.duration);
  };

  const hide = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={index}
            onHide={() => hide(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{
  toast: ToastConfig;
  index: number;
  onHide: () => void;
}> = ({ toast, index, onHide }) => {
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return { bg: '#10b981', icon: '#fff' };
      case 'error':
        return { bg: '#ef4444', icon: '#fff' };
      case 'warning':
        return { bg: '#f59e0b', icon: '#fff' };
      case 'info':
        return { bg: '#3b82f6', icon: '#fff' };
      default:
        return { bg: '#3b82f6', icon: '#fff' };
    }
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.bg,
          top: 60 + index * 80,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={() => {
          toast.onPress?.();
          animateOut();
        }}
        activeOpacity={0.9}
      >
        <MaterialIcons name={getIcon()} size={24} color={colors.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{toast.title}</Text>
          {toast.description && (
            <Text style={styles.description}>{toast.description}</Text>
          )}
        </View>
        <TouchableOpacity onPress={animateOut} style={styles.closeButton}>
          <MaterialIcons name="close" size={20} color={colors.icon} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Convenience methods
export const toast = {
  success: (title: string, description?: string) => {
    // This will be implemented as a singleton
  },
  error: (title: string, description?: string) => {
    // This will be implemented as a singleton
  },
  warning: (title: string, description?: string) => {
    // This will be implemented as a singleton
  },
  info: (title: string, description?: string) => {
    // This will be implemented as a singleton
  },
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
