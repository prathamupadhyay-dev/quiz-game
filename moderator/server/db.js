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

const DEFAULT_URI = 'mongodb+srv://pratham:Pratham123@cluster0.ptfjooq.mongodb.net/zync?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;
let retryTimer = null;
let cached = global._mongoConn;
if (!cached) {
  cached = global._mongoConn = { conn: null, promise: null };
}

async function attemptConnect() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName: 'zync',
      serverSelectionTimeoutMS: 8000,
    }).then((m) => {
      isConnected = true;
      console.log('[DB] Connected to MongoDB Atlas (database: zync)');
      return m;
    }).catch((err) => {
      cached.promise = null;
      isConnected = false;
      console.error('[DB] MongoDB connection error:', err.message);
      scheduleRetry();
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    isConnected = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    return true;
  } catch (err) {
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
