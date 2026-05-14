require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createLogger, format, transports } = require('winston');

const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/score');
const historyRoutes = require('./routes/history');
const rewriteRoutes = require('./routes/rewrite');
const coverLetterRoutes = require('./routes/coverLetter');
const compareRoutes = require('./routes/compare');
const { rateLimiter } = require('./middleware/rateLimiter');
const { authenticate } = require('./middleware/auth');
const { initDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Logger
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

app.use(cors({
  origin: ['http://localhost:4000', 'http://localhost:3000', 'http://127.0.0.1:4000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/score', authenticate, scoreRoutes);
app.use('/api/history', authenticate, historyRoutes);
app.use('/api/rewrite', authenticate, rewriteRoutes);
app.use('/api/cover-letter', authenticate, coverLetterRoutes);
app.use('/api/compare', authenticate, compareRoutes);

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  await initDB();
  app.listen(PORT, () => logger.info(`API Gateway running on port ${PORT}`));
}

start();
module.exports = app;
