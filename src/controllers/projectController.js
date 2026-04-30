const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'Admin'
        ? { isArchived: false }
        : { members: req.user._id, isArchived: false };

    const projects = await Project.find(filter)
      .populate('createdBy', 'name avatar')
      .populate('members', 'name avatar email role')
      .sort('-createdAt');

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const tasks = await Task.find({ project: p._id });
        const obj = p.toJSON();
        obj.taskStats = {
          total: tasks.length,
          todo: tasks.filter((t) => t.status === 'Todo').length,
          inProgress: tasks.filter((t) => t.status === 'In Progress').length,
          done: tasks.filter((t) => t.status === 'Done').length,
        };
        return obj;
      })
    );

    res.json({ success: true, count: projects.length, projects: projectsWithCounts });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name avatar email')
      .populate('members', 'name avatar email role');

    if (!project || project.isArchived) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isMember = project.members.some((m) => m._id.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tasks = await Task.find({ project: project._id });
    const obj = project.toJSON();
    obj.taskStats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'Todo').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      done: tasks.filter((t) => t.status === 'Done').length,
    };

    res.json({ success: true, project: obj });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects  (Admin only)
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, color, members } = req.body;

    // Validate members exist
    let memberIds = [req.user._id.toString()];
    if (members && members.length) {
      const validUsers = await User.find({ _id: { $in: members }, isActive: true });
      const validIds = validUsers.map((u) => u._id.toString());
      memberIds = [...new Set([...memberIds, ...validIds])];
    }

    const project = await Project.create({
      name,
      description,
      color: color || '#4F46E5',
      createdBy: req.user._id,
      members: memberIds,
    });

    await project.populate('members', 'name avatar email role');
    await project.populate('createdBy', 'name avatar');

    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:id  (Admin only)
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, color, isArchived } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (isArchived !== undefined) updates.isArchived = isArchived;

    const project = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('members', 'name avatar email role')
      .populate('createdBy', 'name avatar');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id  (Admin only)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Cascade delete tasks
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Project and all its tasks deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/members  (Admin only)
exports.addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('members', 'name avatar email role');

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id/members/:userId  (Admin only)
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.createdBy.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove project creator' });
    }

    await Project.findByIdAndUpdate(req.params.id, {
      $pull: { members: req.params.userId },
    });

    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id/stats
exports.getProjectStats = async (req, res, next) => {
  try {
    const tasks = await Task.find({ project: req.params.id });
    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'Todo').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      done: tasks.filter((t) => t.status === 'Done').length,
      overdue: tasks.filter((t) => t.isOverdue).length,
      completionRate: tasks.length
        ? Math.round((tasks.filter((t) => t.status === 'Done').length / tasks.length) * 100)
        : 0,
    };
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};
