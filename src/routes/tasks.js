const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getTasks, getTask, updateTask, deleteTask, getDashboardStats } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.use(protect);

router.get('/', getTasks);
router.get('/dashboard', getDashboardStats);
router.get('/:id', getTask);

router.patch(
  '/:id',
  [
    body('title').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
    body('status').optional().isIn(['Todo', 'In Progress', 'Done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  updateTask
);

router.delete('/:id', deleteTask);

module.exports = router;
