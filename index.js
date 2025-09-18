// Polyfills for Node.js modules
import 'react-native-get-random-values';
import 'buffer';

// Set up global polyfills
global.Buffer = global.Buffer || require('buffer').Buffer;

// Create a minimal process polyfill for React Native
if (typeof global.process === 'undefined') {
  global.process = {
    env: {},
    version: '',
    platform: 'react-native',
    nextTick: (callback) => setTimeout(callback, 0),
    cwd: () => '/',
    chdir: () => {},
    umask: () => 0,
    hrtime: () => [0, 0],
    uptime: () => 0,
    memoryUsage: () => ({}),
    exit: () => {},
    kill: () => {},
    on: () => {},
    off: () => {},
    emit: () => {},
    addListener: () => {},
    removeListener: () => {},
    removeAllListeners: () => {},
    setMaxListeners: () => {},
    getMaxListeners: () => 10,
    listeners: () => [],
    listenerCount: () => 0,
    eventNames: () => [],
    prependListener: () => {},
    prependOnceListener: () => {},
    once: () => {},
  };
}

import { registerRootComponent } from 'expo';
import 'react-native-worklets';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
