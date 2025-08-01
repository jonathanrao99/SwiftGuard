const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow resolution of CJS, alias Node built-ins, and blacklist real ws
config.resolver.sourceExts.push('cjs');
config.resolver.extraNodeModules = {
  ws: path.resolve(__dirname, 'shimWs.js'),
  stream: path.resolve(__dirname, 'shimWs.js'),
  crypto: path.resolve(__dirname, 'shimWs.js'),
  url: path.resolve(__dirname, 'shimWs.js'),
  http: path.resolve(__dirname, 'shimWs.js'),
  https: path.resolve(__dirname, 'shimWs.js'),
  net: path.resolve(__dirname, 'shimWs.js'),
  tls: path.resolve(__dirname, 'shimWs.js'),
  events: path.resolve(__dirname, 'shimWs.js'),
  zlib: path.resolve(__dirname, 'shimWs.js'),
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