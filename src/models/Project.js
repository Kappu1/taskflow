const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    color: {
      type: String,
      default: '#4F46E5',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Ensure creator is always a member
projectSchema.pre('save', function (next) {
  const creatorId = this.createdBy.toString();
  const memberIds = this.members.map((m) => m.toString());
  if (!memberIds.includes(creatorId)) {
    this.members.unshift(this.createdBy);
  }
  next();
});

// Virtual: task count (populated separately)
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);
