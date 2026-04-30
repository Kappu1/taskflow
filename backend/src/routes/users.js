const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, deleteUser, getUserStats } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect); // all routes require auth

router.get('/', getUsers);
router.get('/:id', getUser);
router.get('/:id/stats', getUserStats);
router.patch('/:id', adminOnly, updateUser);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
