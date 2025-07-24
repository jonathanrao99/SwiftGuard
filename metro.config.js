const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow resolution of CJS, alias Node built-ins, and blacklist real ws
config.resolver.sourceExts.push('cjs');
config.resolver.blockList = exclusionList([/node_modules\/ws\/.*/]);
config.resolver.extraNodeModules = {
  ws: path.resolve(__dirname, 'shimWs.js'),
};

module.exports = config; 