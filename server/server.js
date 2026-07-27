require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', authRoutes);

// Health Check Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'MERN Two-Token Authentication API Server',
    status: 'Running',
    endpoints: {
      signup: 'POST /api/signup',
      login: 'POST /api/login',
      refresh: 'POST /api/refresh',
      logout: 'POST /api/logout',
      dashboard: 'GET /api/dashboard (Protected)',
    },
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`===========================================`);
});
