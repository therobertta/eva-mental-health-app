const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { generateToken, hashPassword, comparePassword, authenticateToken } = require('../utils/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }
    
    // Create user
    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();
    
    await db.query(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
      [userId, email, hashedPassword, name || '']
    );
    
    // Create default therapeutic profile
    await db.query(
      `INSERT INTO therapeutic_profiles (user_id, therapeutic_preferences, vulnerability_comfort_level, primary_framework)
       VALUES ($1, $2, $3, $4)`,
      [userId, JSON.stringify({}), 5, 'humanistic']
    );
    
    // Generate token
    const token = generateToken(userId);
    
    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        name: name || ''
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register user'
      }
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }
    
    // Find user
    const result = await db.query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }
    
    // Update last active
    await db.query(
      'UPDATE users SET last_active = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Generate token
    const token = generateToken(user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'LOGIN_FAILED',
        message: 'Failed to login'
      }
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.created_at,
              tp.therapeutic_preferences, tp.vulnerability_comfort_level, tp.primary_framework
       FROM users u
       LEFT JOIN therapeutic_profiles tp ON u.id = tp.user_id
       WHERE u.id = $1`,
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      therapeuticProfile: {
        preferences: user.therapeutic_preferences,
        vulnerabilityComfortLevel: user.vulnerability_comfort_level,
        primaryFramework: user.primary_framework
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch user profile'
      }
    });
  }
});

module.exports = router;