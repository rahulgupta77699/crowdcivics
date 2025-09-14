const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const database = require('../config/database');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if using fallback mode
    if (database.fallbackMode) {
      // Local storage mode
      const existingUser = await database.findOneLocal('users', { email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await database.createLocal('users', {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'citizen',
        civicPoints: 0,
        stats: {
          totalReports: 0,
          resolvedReports: 0,
          pendingReports: 0,
          upvotesReceived: 0
        }
      });

      const token = generateToken(newUser._id);
      
      const userResponse = { ...newUser };
      delete userResponse.password;

      res.status(201).json({
        success: true,
        token,
        user: userResponse
      });
    } else {
      // MongoDB mode
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const user = await User.create({
        name,
        email,
        password,
        phone
      });

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: user.getPublicProfile()
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to create account' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    if (database.fallbackMode) {
      // Local storage mode
      const user = await database.findOneLocal('users', { email });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await database.updateLocal('users', { _id: user._id }, { lastLogin: new Date().toISOString() });

      const token = generateToken(user._id);
      
      const userResponse = { ...user };
      delete userResponse.password;

      res.json({
        success: true,
        token,
        user: userResponse
      });
    } else {
      // MongoDB mode
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      user.lastLogin = Date.now();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: user.getPublicProfile()
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    let user;
    if (database.fallbackMode) {
      user = await database.findOneLocal('users', { _id: decoded.id });
      if (user) {
        delete user.password;
      }
    } else {
      user = await User.findById(decoded.id);
      if (user) {
        user = user.getPublicProfile();
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;