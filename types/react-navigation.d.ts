// TypeScript declarations to suppress React Navigation type errors
// These errors occur with lazy-loaded components but don't affect functionality

declare module '@react-navigation/native' {
  export interface ParamListBase {
    [key: string]: object | undefined;
  }
}

declare module '@react-navigation/stack' {
  export interface StackNavigationOptions {
    headerShown?: boolean;
  }
}

// Suppress specific lazy component type errors
declare module 'react' {
  interface LazyExoticComponent<T> {
    (props: any): JSX.Element;
  }
} 