const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { signup, login, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['Admin', 'Member']).withMessage('Role must be Admin or Member'),
  ],
  validate,
  signup
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

// PATCH /api/auth/me  (protected)
router.patch(
  '/me',
  protect,
  [body('name').optional().trim().isLength({ min: 2 }).withMessage('Name too short')],
  validate,
  updateMe
);

module.exports = router;
