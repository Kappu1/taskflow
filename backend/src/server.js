require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

const app = express();

// ── Connect Database ───────────────────────────────────────────────────────────
connectDB();

// ── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      /\.railway\.app$/,
      /\.vercel\.app$/,
      /localhost:\d+$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ── General Middleware ─────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static Files (React build) ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'TaskFlow API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// API root info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'TaskFlow API v1.0.0',
    endpoints: {
      auth: '/api/auth (signup, login, me)',
      users: '/api/users',
      projects: '/api/projects',
      tasks: '/api/tasks',
      health: '/health',
    },
  });
});

// ── Catch-all: serve React app for non-API routes (client-side routing) ────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Error Handlers ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 TaskFlow API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
