import express from 'express';
// @ts-ignore - bcryptjs doesn't have TypeScript declarations
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import upload from '../middleware/uploadMiddleware.js';
import { models } from '../models/index.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const JWT_SECRET = config.jwt.secret;

// --- 2FA Endpoints ---

// Generate 2FA Secret (Step 1 of Setup)
router.post('/2fa/setup', authenticateToken, async (req, res) => {
  try {
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const user = await models.User.findByPk(req.user.userId);

    // Generate a temporary secret
    const secret = speakeasy.generateSecret({
      name: `ESG-Platform (${user.email})`
    });

    // Save temporary secret to user
    // We update the user record but keep enabled=false until verified
    user.two_factor_secret = secret.base32;
    await user.save();

    // Generate QR Code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error generating 2FA secret' });
  }
});

// Verify and Enable 2FA (Step 2 of Setup)
router.post('/2fa/verify', authenticateToken, async (req, res) => {
  try {
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { token } = req.body;
    const user = await models.User.findByPk(req.user.userId);

    if (!user.two_factor_secret) {
      return res.status(400).json({ error: '2FA setup not initiated' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      user.two_factor_enabled = true;
      await user.save();
      res.json({ message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ error: 'Invalid verification code' });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error verifying 2FA' });
  }
});

// Validate 2FA during Login (Step 2 of Login)
router.post('/2fa/validate', async (req, res) => {
  try {
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { userId, token } = req.body;
    const user = await models.User.findByPk(userId);

    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      // Issue the real JWT
      const authToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        token: authToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid 2FA code' });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Standard Auth Routes ---

// User signup
router.post('/signup', async (req, res) => {
  try {
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { email, password, fullName } = req.body;
    const existingUser = await models.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    await models.User.create({
      email,
      password_hash: hashedPassword,
      full_name: fullName,
      status: 'pending',
      role: 'user'
    });

    res.json({ message: 'Account request submitted! Awaiting admin approval.' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { email, password } = req.body;
    const user = await models.User.findOne({
      where: { email, status: 'approved' }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or account not approved' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check for 2FA
    if (user.two_factor_enabled) {
      return res.json({
        requires2FA: true,
        userId: user.id,
        message: 'Two-factor authentication required'
      });
    }

    // Standard Login
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get pending users (admin only)
router.get('/pending-users', authenticateToken, async (req, res) => {
  try {
    // Basic check - real app would use authorizeRole middleware
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const users = await models.User.findAll({
      where: { status: 'pending' },
      attributes: ['id', 'email', 'full_name', 'created_at']
    });
    res.json(users);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Approve user (admin only)
router.put('/approve-user/:email', authenticateToken, async (req, res) => {
  try {
    // Check authentication and authorization
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { email } = req.params;
    const [updated] = await models.User.update(
      { status: 'approved', approved_at: new Date() },
      { where: { email } }
    );

    if (updated === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User approved successfully' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Reject user (admin only)
router.delete('/reject-user/:email', authenticateToken, async (req, res) => {
  try {
    // Check authentication and authorization
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { email } = req.params;
    const deleted = await models.User.destroy({
      where: { email, status: 'pending' }
    });

    if (deleted === 0) {
      return res.status(404).json({ error: 'User not found or not pending' });
    }
    res.json({ message: 'User rejected successfully' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- Profile Endpoints ---

// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await models.User.findByPk(req.user.userId, {
      attributes: { exclude: ['password_hash', 'two_factor_secret'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update User Profile (Bio, Title, Phone)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const { full_name, bio, job_title, phone_number } = req.body;
    const user = await models.User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.full_name = full_name || user.full_name;
    user.bio = bio || user.bio;
    user.job_title = job_title || user.job_title;
    user.phone_number = phone_number || user.phone_number;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        profile_picture: user.profile_picture,
        bio: user.bio,
        job_title: user.job_title
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload Profile Picture
router.post('/profile/upload', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    // Validate CSRF token
    if (!req.headers['x-csrf-token']) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await models.User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete old profile picture if exists - with path traversal protection
    if (user.profile_picture) {
      // Sanitize the path to prevent path traversal
      const sanitizedPath = path.basename(user.profile_picture);
      const oldPath = path.join(__dirname, '..', 'uploads', 'profiles', sanitizedPath);
      
      // Ensure the path is within the uploads directory
      const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'profiles');
      const resolvedPath = path.resolve(oldPath);
      
      if (resolvedPath.startsWith(uploadsDir) && fs.existsSync(resolvedPath)) {
        try { 
          fs.unlinkSync(resolvedPath); 
        } catch (e) { 
          console.error('Failed to delete old image', e); 
        }
      }
    }

    // Save new path (relative for frontend access)
    // multer saves to uploads/profiles/filename, we want /uploads/profiles/filename
    const relativePath = `/uploads/profiles/${req.file.filename}`;
    user.profile_picture = relativePath;
    await user.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profile_picture: relativePath
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Error processing file upload' });
  }
});

export default router;