require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const alice = await User.create({ name: 'Alice Admin', email: 'alice@demo.com', password: 'admin123', role: 'Admin' });
    const bob = await User.create({ name: 'Bob Member', email: 'bob@demo.com', password: 'member123', role: 'Member' });
    const carol = await User.create({ name: 'Carol Dev', email: 'carol@demo.com', password: 'carol123', role: 'Member' });
    console.log('✅ Users created');

    // Create projects
    const p1 = await Project.create({
      name: 'Website Redesign',
      description: 'Revamp company website with new brand identity',
      color: '#4F46E5',
      createdBy: alice._id,
      members: [alice._id, bob._id, carol._id],
    });

    const p2 = await Project.create({
      name: 'Mobile App MVP',
      description: 'Build first version of the mobile application',
      color: '#10B981',
      createdBy: alice._id,
      members: [alice._id, carol._id],
    });
    console.log('✅ Projects created');

    // Create tasks
    const tasks = [
      { title: 'Design wireframes', description: 'Create wireframes for all major pages', project: p1._id, assignee: bob._id, status: 'Done', priority: 'High', dueDate: new Date('2026-04-20'), createdBy: alice._id },
      { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for deployment', project: p1._id, assignee: carol._id, status: 'In Progress', priority: 'High', dueDate: new Date('2026-04-30'), createdBy: alice._id },
      { title: 'Write API documentation', description: 'Document all REST endpoints with examples', project: p1._id, assignee: bob._id, status: 'Todo', priority: 'Medium', dueDate: new Date('2026-05-10'), createdBy: alice._id },
      { title: 'Homepage hero section', description: 'Implement responsive hero with CTA', project: p1._id, assignee: carol._id, status: 'Todo', priority: 'High', dueDate: new Date('2026-05-01'), createdBy: alice._id },
      { title: 'Design system components', description: 'Build reusable component library', project: p2._id, assignee: carol._id, status: 'In Progress', priority: 'High', dueDate: new Date('2026-04-28'), createdBy: alice._id },
      { title: 'User authentication flow', description: 'Implement login, signup, forgot password', project: p2._id, assignee: alice._id, status: 'Todo', priority: 'High', dueDate: new Date('2026-05-05'), createdBy: alice._id },
      { title: 'Analytics integration', description: 'Add event tracking across the app', project: p2._id, assignee: carol._id, status: 'Todo', priority: 'Low', dueDate: new Date('2026-05-20'), createdBy: alice._id },
    ];

    await Task.insertMany(tasks);
    console.log('✅ Tasks created');

    console.log('\n🎉 Seed complete!');
    console.log('Demo accounts:');
    console.log('  Admin  → alice@demo.com / admin123');
    console.log('  Member → bob@demo.com   / member123');
    console.log('  Member → carol@demo.com / carol123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
