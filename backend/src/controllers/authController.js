const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

// POST /api/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Only allow Admin role if first user OR if an existing Admin creates them
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'Admin' : (role === 'Admin' ? 'Admin' : 'Member');

    const user = await User.create({ name, email, password, role: assignedRole });
    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Remove password before sending
    user.password = undefined;
    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PATCH /api/auth/me
exports.updateMe = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (password) {
      if (password.length < 6) {
        return res.status(422).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      updates.password = password;
    }

    const user = await User.findById(req.user._id);
    Object.assign(user, updates);
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
