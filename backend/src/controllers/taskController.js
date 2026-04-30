const Task = require('../models/Task');
const Project = require('../models/Project');

// GET /api/tasks  (all tasks visible to user)
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, assignee, project, overdue } = req.query;

    // Build base filter by accessible projects
    let accessibleProjectIds;
    if (req.user.role === 'Admin') {
      const projects = await Project.find({ isArchived: false }).select('_id');
      accessibleProjectIds = projects.map((p) => p._id);
    } else {
      const projects = await Project.find({ members: req.user._id, isArchived: false }).select('_id');
      accessibleProjectIds = projects.map((p) => p._id);
    }

    const filter = { project: { $in: accessibleProjectIds } };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (project) filter.project = project;
    if (overdue === 'true') {
      filter.status = { $ne: 'Done' };
      filter.dueDate = { $lt: new Date() };
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .populate('project', 'name color')
      .sort('-createdAt');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/tasks
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { status, priority, assignee } = req.query;
    const filter = { project: req.params.projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .sort('-createdAt');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .populate('project', 'name color members');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Check access
    const project = await Project.findById(task.project._id);
    const isMember = project.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assignee } = req.body;
    const projectId = req.params.projectId;

    const project = await Project.findById(projectId);
    if (!project || project.isArchived) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check membership
    const isMember = project.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not a member of this project' });
    }

    // Validate assignee is a project member
    if (assignee) {
      const isAssigneeMember = project.members.some((m) => m.toString() === assignee);
      if (!isAssigneeMember) {
        return res.status(400).json({ success: false, message: 'Assignee must be a project member' });
      }
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      assignee: assignee || null,
      project: projectId,
      createdBy: req.user._id,
    });

    await task.populate('assignee', 'name avatar email');
    await task.populate('createdBy', 'name avatar');
    await task.populate('project', 'name color');

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'members');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isAdmin = req.user.role === 'Admin';
    const isAssignee = task.assignee?.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    // Members can only update tasks they created or are assigned to
    if (!isAdmin && !isAssignee && !isCreator) {
      return res.status(403).json({ success: false, message: 'You can only update your own tasks' });
    }

    const { title, description, status, priority, dueDate, assignee } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;

    // Only admin can reassign
    if (assignee !== undefined) {
      if (!isAdmin && !isCreator) {
        return res.status(403).json({ success: false, message: 'Only Admins and task creators can reassign tasks' });
      }
      // Validate assignee is project member
      if (assignee) {
        const project = await require('../models/Project').findById(task.project._id);
        const isAssigneeMember = project.members.some((m) => m.toString() === assignee);
        if (!isAssigneeMember) {
          return res.status(400).json({ success: false, message: 'Assignee must be a project member' });
        }
      }
      updates.assignee = assignee || null;
    }

    Object.assign(task, updates);
    await task.save();

    await task.populate('assignee', 'name avatar email');
    await task.populate('createdBy', 'name avatar');
    await task.populate('project', 'name color');

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id  (Admin or task creator)
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isAdmin = req.user.role === 'Admin';
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'Only Admins and task creators can delete tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/dashboard  (summary stats for current user)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'Admin';

    let projectFilter = isAdmin
      ? { isArchived: false }
      : { members: req.user._id, isArchived: false };

    const projects = await Project.find(projectFilter).select('_id');
    const projectIds = projects.map((p) => p._id);

    const allTasks = await Task.find({ project: { $in: projectIds } });
    const myTasks = allTasks.filter(
      (t) => t.assignee?.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      stats: {
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        myTasks: myTasks.length,
        todo: allTasks.filter((t) => t.status === 'Todo').length,
        inProgress: allTasks.filter((t) => t.status === 'In Progress').length,
        done: allTasks.filter((t) => t.status === 'Done').length,
        overdue: allTasks.filter((t) => t.isOverdue).length,
        myOverdue: myTasks.filter((t) => t.isOverdue).length,
      },
    });
  } catch (err) {
    next(err);
  }
};
