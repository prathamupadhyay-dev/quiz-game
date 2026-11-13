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

const DEFAULT_URI = 'mongodb+srv://raideninghok1_db_user:cJxdk9ZQmHAFeO8N@cluster0.ptfjooq.mongodb.net/zync?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;
let retryTimer = null;
let connectPromise = null;

async function attemptConnect() {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }
  if (mongoose.connection.readyState === 2 && connectPromise) {
    return await connectPromise;
  }

  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  connectPromise = mongoose.connect(uri, {
    dbName: 'zync',
    serverSelectionTimeoutMS: 8000,
  }).then((m) => {
    isConnected = true;
    console.log('[DB] Admin connected to MongoDB Atlas (database: zync)');
    return true;
  }).catch((err) => {
    connectPromise = null;
    isConnected = false;
    console.error('[DB] Admin MongoDB connection error:', err.message);
    scheduleRetry();
    return false;
  });

  return await connectPromise;
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

connectDB().catch(() => {});

module.exports = {
  connectDB,
  getDbStatus
};
