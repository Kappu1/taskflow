const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getProjects, getProject, createProject, updateProject,
  deleteProject, addMember, removeMember, getProjectStats,
} = require('../controllers/projectController');
const { getProjectTasks, createTask } = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.use(protect);

// Project CRUD
router.get('/', getProjects);
router.get('/:id', getProject);
router.get('/:id/stats', getProjectStats);

router.post(
  '/',
  adminOnly,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex color'),
  ],
  validate,
  createProject
);

router.patch('/:id', adminOnly, updateProject);
router.delete('/:id', adminOnly, deleteProject);

// Member management
router.post('/:id/members', adminOnly, addMember);
router.delete('/:id/members/:userId', adminOnly, removeMember);

// Tasks within project
router.get('/:projectId/tasks', getProjectTasks);
router.post(
  '/:projectId/tasks',
  [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
    body('status').optional().isIn(['Todo', 'In Progress', 'Done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  createTask
);

module.exports = router;
