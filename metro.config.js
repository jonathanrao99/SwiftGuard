const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow resolution of CJS
config.resolver.sourceExts.push('cjs');

// Comprehensive Node.js polyfills for React Native compatibility
config.resolver.alias = {
  ...config.resolver.alias,
  // Essential polyfills for Supabase
  'crypto': 'react-native-crypto',
  'stream': 'stream-browserify',
  'buffer': 'buffer', 
  'events': 'events',
  'util': 'util',
};

// Configure resolver to prefer React Native compatible modules  
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add resolver configuration for better module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Use custom resolver to handle problematic Node.js modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block problematic Node.js server modules that Supabase realtime tries to use
  if (moduleName === 'ws' || 
      moduleName === 'http' || 
      moduleName === 'https' ||
      moduleName === 'net' ||
      moduleName === 'tls' ||
      moduleName === 'zlib' ||
      moduleName === 'fs' ||
      moduleName === 'child_process') {
    return { type: 'empty' };
  }
  
  // For the specific problematic realtime-js WebSocket files, return empty
  if (moduleName.includes('@supabase/realtime-js') && 
      (moduleName.includes('websocket') || moduleName.includes('ws'))) {
    return { type: 'empty' };
  }

  // Use default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

// Bundle optimization settings
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
  output: {
    ascii_only: true,
    quote_style: 3,
    wrap_iife: true,
  },
  compress: {
    reduce_funcs: false,
  },
};

// Optimize asset handling
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Enable tree shaking
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config; 