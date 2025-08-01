// Comprehensive WebSocket shim for React Native
const { WebSocket } = require('react-native');

// Mock stream module to prevent ws library errors
const stream = {
  Duplex: class Duplex {
    constructor() {
      this.readable = false;
      this.writable = false;
    }
  },
  Readable: class Readable {
    constructor() {
      this.readable = true;
    }
  },
  Writable: class Writable {
    constructor() {
      this.writable = true;
    }
  }
};

// Mock other Node.js modules that ws might try to use
const events = {
  EventEmitter: class EventEmitter {
    constructor() {
      this.events = {};
    }
    on(event, listener) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
    }
    emit(event, ...args) {
      if (this.events[event]) {
        this.events[event].forEach(listener => listener(...args));
      }
    }
  }
};

const crypto = {
  randomBytes: () => new Uint8Array(16),
  createHash: () => ({
    update: () => ({ digest: () => 'mock-hash' })
  })
};

const url = {
  parse: (url) => ({ hostname: 'localhost', port: 80, path: '/' }),
  format: (parsed) => 'ws://localhost'
};

const http = {
  request: () => ({
    on: () => {},
    write: () => {},
    end: () => {}
  })
};

const https = {
  request: () => ({
    on: () => {},
    write: () => {},
    end: () => {}
  })
};

const net = {
  createConnection: () => ({
    on: () => {},
    write: () => {},
    end: () => {}
  })
};

const tls = {
  connect: () => ({
    on: () => {},
    write: () => {},
    end: () => {}
  })
};

const zlib = {
  inflate: () => ({
    on: () => {},
    write: () => {},
    end: () => {}
  }),
  deflate: () => ({
    on: () => {},
    write: () => {},
    end: () => {}
  })
};

// Export the WebSocket and mocked modules
module.exports = WebSocket;
module.exports.stream = stream;
module.exports.crypto = crypto;
module.exports.url = url;
module.exports.http = http;
module.exports.https = https;
module.exports.net = net;
module.exports.tls = tls;
module.exports.events = events;
module.exports.zlib = zlib; 