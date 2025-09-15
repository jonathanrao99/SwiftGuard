// Polyfills for Node.js modules
import 'react-native-get-random-values';
import 'buffer';

// Set up global polyfills
global.Buffer = global.Buffer || require('buffer').Buffer;
global.process = global.process || require('process');

import { registerRootComponent } from 'expo';
import 'react-native-worklets';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
