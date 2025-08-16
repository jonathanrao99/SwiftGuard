/**
 * WebSocket polyfill for React Native compatibility with Supabase realtime
 * This resolves the Node.js module conflicts
 */

// React Native already has WebSocket support
// We just need to ensure it's available globally
if (typeof global !== 'undefined' && !global.WebSocket) {
  global.WebSocket = WebSocket;
}

// Polyfill for EventEmitter if needed
if (typeof global !== 'undefined' && !global.EventEmitter) {
  const { EventEmitter } = require('events');
  global.EventEmitter = EventEmitter;
}

// Export for explicit imports
export default WebSocket;
