const express = require('express');
const router = express.Router();
const { uploadProfileImage, getUserProfileData, saveUserProfileData } = require('../controller/profileController');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// POST /api/profile-image/upload - Upload profile image
router.post('/upload', verifyToken, uploadProfileImage);

// GET /api/profile-image - Get user's complete profile data
router.get('/', verifyToken, getUserProfileData);

// POST /api/profile-image/save - Save user's profile data (course, year, status)
router.post('/save', verifyToken, saveUserProfileData);

module.exports = router;