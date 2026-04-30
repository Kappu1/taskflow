const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Verify JWT ────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or user no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid token',
    });
  }
};

// ── Require Admin role ────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden — Admin access required',
    });
  }
  next();
};

// ── Require specific roles ────────────────────────────────────────────────────
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden — requires one of: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

// ── Check project membership ──────────────────────────────────────────────────
const Project = require('../models/Project');

const projectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.project || req.params.id;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === 'Admin';

    if (!isMember && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you are not a member of this project',
      });
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect, adminOnly, requireRole, projectMember };
