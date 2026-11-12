const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore
}

const path = require('path');
require('dotenv').config();
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env.shared'), override: true });
}

const mongoose = require('mongoose');

let isConnected = false;
let retryTimer = null;

async function attemptConnect() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.warn('[DB] MONGODB_URI is not set. Retrying in 5 seconds...');
    scheduleRetry();
    return false;
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'zync',
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    console.log('[DB] Connected to MongoDB (database: zync)');
    return true;
  } catch (err) {
    isConnected = false;
    console.error('[DB] MongoDB connection error:', err.message);
    console.error('[DB] Likely causes:\n' +
      '  - Atlas Network Access must allow this IP (or 0.0.0.0/0)\n' +
      '  - Wrong username or password\n' +
      '  - Special characters in password not URL-encoded\n' +
      '  - Local DNS resolver unable to resolve SRV records');
    scheduleRetry();
    return false;
  }
}

function scheduleRetry() {
  if (!retryTimer) {
    retryTimer = setTimeout(() => {
      retryTimer = null;
      attemptConnect();
    }, 5000);
  }
}

async function connectDB() {
  return await attemptConnect();
}

function getDbStatus() {
  return isConnected || mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  getDbStatus
};
