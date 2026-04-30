const User = require('../models/User');
const Task = require('../models/Task');

// GET /api/users  (Admin: all users, Member: users in shared projects)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).select('-password').sort('name');
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id  (Admin only - change role, deactivate)
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString() && role && role !== 'Admin') {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...(role && { role }), ...(isActive !== undefined && { isActive }) },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id  (Admin only - soft delete)
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/stats
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const tasks = await Task.find({ assignee: userId });
    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'Todo').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      done: tasks.filter((t) => t.status === 'Done').length,
      overdue: tasks.filter((t) => t.isOverdue).length,
    };
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};
