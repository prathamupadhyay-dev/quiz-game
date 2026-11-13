require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getDbStatus } = require('./db');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: true,
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

