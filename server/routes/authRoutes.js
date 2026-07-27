const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  refresh,
  logout,
  getDashboard,
} = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

// Public authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected route requiring valid Access Token
router.get('/dashboard', verifyToken, getDashboard);

module.exports = router;
