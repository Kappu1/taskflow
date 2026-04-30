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

// Temporary seed route - remove after use
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

router.post('/seed', async (req, res) => {
  try {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    const alice = await User.create({ name: 'Alice Admin', email: 'alice@demo.com', password: 'admin123', role: 'Admin' });
    const bob = await User.create({ name: 'Bob Member', email: 'bob@demo.com', password: 'member123', role: 'Member' });
    const carol = await User.create({ name: 'Carol Dev', email: 'carol@demo.com', password: 'carol123', role: 'Member' });

    const p1 = await Project.create({ name: 'Website Redesign', description: 'Revamp company website', color: '#4F46E5', createdBy: alice._id, members: [alice._id, bob._id, carol._id] });
    const p2 = await Project.create({ name: 'Mobile App MVP', description: 'Build mobile application', color: '#10B981', createdBy: alice._id, members: [alice._id, carol._id] });

    await Task.create([
      { title: 'Design wireframes', project: p1._id, assignee: bob._id, status: 'Done', priority: 'High', dueDate: new Date('2026-04-20'), createdBy: alice._id },
      { title: 'Set up CI/CD', project: p1._id, assignee: carol._id, status: 'In Progress', priority: 'High', dueDate: new Date('2026-04-30'), createdBy: alice._id },
      { title: 'Write API docs', project: p1._id, assignee: bob._id, status: 'Todo', priority: 'Medium', dueDate: new Date('2026-05-10'), createdBy: alice._id },
      { title: 'Design system', project: p2._id, assignee: carol._id, status: 'In Progress', priority: 'High', dueDate: new Date('2026-04-28'), createdBy: alice._id },
      { title: 'Auth flow', project: p2._id, assignee: alice._id, status: 'Todo', priority: 'High', dueDate: new Date('2026-05-05'), createdBy: alice._id },
    ]);

    res.json({ success: true, message: 'Seeded! alice@demo.com/admin123, bob@demo.com/member123' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});
module.exports = router;
