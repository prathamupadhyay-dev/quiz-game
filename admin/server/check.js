const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
const path = require('path');
require('dotenv').config();
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env.shared'), override: true });
}

const mongoose = require('mongoose');

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('FAIL: MONGODB_URI is not configured');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { dbName: 'zync', serverSelectionTimeoutMS: 10000 });
    console.log('PASS: Database connection successful to "zync"');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('FAIL: MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

check();
