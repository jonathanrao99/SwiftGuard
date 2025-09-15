const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow resolution of CJS
config.resolver.sourceExts.push('cjs');

// Add Node.js polyfills for React Native
config.resolver.alias = {
  ...config.resolver.alias,
  stream: 'stream-browserify',
  crypto: 'react-native-crypto',
  buffer: 'buffer',
  events: 'events',
  util: 'util',
  assert: 'assert',
  url: 'url',
  querystring: 'querystring-es3',
  path: 'path-browserify',
  fs: false,
  net: false,
  tls: false,
  child_process: false,
};

// Bundle optimization settings for faster loading
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
    drop_console: false, // Keep console logs for debugging
    drop_debugger: false,
  },
};

// Optimize for faster bundling
config.transformer.unstable_disableES6Transforms = false;
config.transformer.enableBabelRCLookup = false;
config.transformer.unstable_allowRequireContext = true;

// Optimize asset handling
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Enable tree shaking
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Optimize chunk loading
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [
    require.resolve('react-native/Libraries/Core/InitializeCore'),
  ],
  createModuleIdFactory: () => {
    const fileToIdMap = new Map();
    let nextId = 0;
    return (path) => {
      if (!fileToIdMap.has(path)) {
        fileToIdMap.set(path, nextId++);
      }
      return fileToIdMap.get(path);
    };
  },
};

module.exports = config; 