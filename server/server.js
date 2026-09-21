const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// Security & Header Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts and remote CDN font icons
}));
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300 // limit each IP to 300 requests per windowMs
});
app.use('/api', limiter);

// Serve Static Assets & Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../')));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/comics', require('./routes/comics.routes'));

// API Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ComicVerse REST API Server is running cleanly',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use(errorMiddleware);

// Fallback Route for Single Page Client Navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start Server
app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ComicVerse REST API running on http://localhost:${env.PORT}`);
  console.log(`=======================================================`);
});
