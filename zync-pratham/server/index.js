require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const { rooms, setupRoomHandler } = require('./socket/roomHandler');
const { router: quizRoutes, seedDefaultQuizIfEmpty } = require('./routes/quizRoutes');

// Import models
const Quiz = require('./models/Quiz');
const Presentation = require('./models/Presentation');
const GameResult = require('./models/GameResult');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/classroom_arena';

// Enable CORS on Express for all origins so mobile devices on Wi-Fi can connect
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Mount quiz REST APIs
app.use('/api/quizzes', quizRoutes);

// Results API (Save final session leaderboard)
app.post('/api/results', async (req, res) => {
  try {
    const { roomPin, mode, leaderboard } = req.body;
    let result = null;
    try {
      result = await GameResult.create({
        roomPin,
        mode: mode || 'quiz',
        leaderboard: leaderboard || []
      });
    } catch (e) {
      // In-memory fallback
      result = { roomPin, mode, leaderboard, createdAt: new Date().toISOString() };
    }
    res.status(201).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Track MongoDB connection status
let isMongoConnected = false;

// Connect to MongoDB with fallback so server never crashes if MongoDB is not running locally
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 2500
})
.then(async () => {
  isMongoConnected = true;
  console.log(`[MongoDB] Connected successfully to ${MONGO_URI}`);
  await seedDefaultQuizIfEmpty();
})
.catch((err) => {
  isMongoConnected = false;
  console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${MONGO_URI}.`);
  console.warn(`[MongoDB Warning] Server will continue running in in-memory mode for rooms & socket events.`);
});

mongoose.connection.on('connected', () => {
  isMongoConnected = true;
});
mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    mongo: {
      connected: isMongoConnected,
      status: isMongoConnected ? 'connected' : 'disconnected / offline',
      uri: MONGO_URI
    },
    activeRooms: rooms.size
  });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Classroom Arena Server is running',
    version: '1.0.0',
    healthEndpoint: '/api/health',
    quizzesEndpoint: '/api/quizzes'
  });
});

// Create HTTP server & Socket.io with CORS enabled for mobile Wi-Fi access
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach socket room handlers
setupRoomHandler(io);

// Start listening on 0.0.0.0 so all network devices can reach it
server.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(` Classroom Arena Server running on port ${PORT}`);
  console.log(` Network URL: http://0.0.0.0:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Quizzes API: http://localhost:${PORT}/api/quizzes`);
  console.log(`===============================================`);
});
