require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getDbStatus } = require('./db');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5001;

// Allowed Origins for all 5 ZYNC apps
const allowedOrigins = [
  'http://localhost:5171', // Admin (Pratham)
  'http://localhost:5172', // Student (Dhruv)
  'http://localhost:5173', // Teacher quizzes (Ramya)
  'http://localhost:5174', // Moderator and slides (Utkarsh)
  'http://localhost:5175'  // Principal (Nihal)
];

if (process.env.CLIENT_ORIGIN && !allowedOrigins.includes(process.env.CLIENT_ORIGIN)) {
  allowedOrigins.push(process.env.CLIENT_ORIGIN);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'zync-pratham',
    role: 'admin',
    dbConnected: getDbStatus()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({
    error: 'Internal server error occurred'
  });
});

// Start server and initialize database connection
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`ZYNC Admin server running on port ${PORT}`);
    await connectDB();
  });
}

module.exports = app;

