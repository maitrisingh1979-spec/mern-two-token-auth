const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokenUtils');

/**
 * @route   POST /api/signup
 * @desc    Register a new user
 */
const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully! You can now log in.',
      user: {
        id: newUser._id,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('[Signup Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup.',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/login
 * @desc    Validate user, generate Access Token (15m) & Refresh Token (7d), save refresh token in DB
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to MongoDB database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/refresh
 * @desc    Accept refresh token, verify against secret & DB, issue new access token
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh Token required in request body.',
      });
    }

    // Verify Refresh Token JWT signature & expiration
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired Refresh Token. Please log in again.',
      });
    }

    // Find user in database and check if token matches
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: 'Refresh Token has been revoked or does not match system records.',
      });
    }

    // Issue brand new Access Token (15m)
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      message: 'Access Token refreshed successfully.',
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('[Refresh Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh.',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/logout
 * @desc    Logout user by removing refresh token from DB
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Refresh token revoked.',
    });
  } catch (error) {
    console.error('[Logout Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout.',
    });
  }
};

/**
 * @route   GET /api/dashboard
 * @desc    Protected route requiring valid Access Token middleware
 */
const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');

    res.status(200).json({
      success: true,
      message: 'Welcome to the Protected Assessment Dashboard!',
      user: user || { id: req.user.id, email: req.user.email },
      systemMetrics: {
        serverStatus: 'Operational 🟢',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        authMethod: 'Dual Token (JWT Access 15m + JWT Refresh 7d)',
      },
    });
  } catch (error) {
    console.error('[Dashboard Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data.',
    });
  }
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
  getDashboard,
};
