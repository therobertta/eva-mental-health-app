require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const assessmentRoutes = require('./routes/assessments');
const goalRoutes = require('./routes/goals');
const dialecticRoutes = require('./routes/dialectic');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/dialectic', dialecticRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'SERVER_ERROR'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Eva Mental Health API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});