const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const comicRoutes = require('./routes/comicRoutes');
const chapterRoutes = require('./routes/chapterRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const engagementRoutes = require('./routes/engagementRoutes');
const featureRoutes = require('./routes/featureRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const Scheduler = require('./services/schedulerService');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

app.use((req,res,next)=>{req.requestId=req.headers['x-request-id']||`ev-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;res.setHeader('X-Request-Id',req.requestId);next();});

// Security Headers with relaxed directive for image serving and canvas
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = String(require('./config/env').ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => { if(!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null,true); return cb(new Error('CORS origin not allowed.')); }, methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders:['Content-Type','Authorization','X-Request-Id'] }));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);
const loginLimiter = rateLimit({windowMs:15*60*1000,max:15,standardHeaders:true,legacyHeaders:false,message:{error:'Too many login attempts. Try again later.'}});

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Assets
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use(express.static(path.join(__dirname, '../../frontend')));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date(), service: "Elder's Veil Comic Platform API" });
});

// API Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/comics', comicRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/payments', paymentRoutes);
Scheduler.start();

// Fallback route for SPA / Frontend pages
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  const frontendPath = path.join(__dirname, '../../frontend', req.path);
  if (req.path.endsWith('.html') || req.path.endsWith('.css') || req.path.endsWith('.js') || req.path.endsWith('.png') || req.path.endsWith('.jpg')) {
    return res.sendFile(frontendPath, (err) => {
      if (err) res.status(404).sendFile(path.join(__dirname, '../../frontend/404.html'));
    });
  }
  // Default to index.html for root or custom routes
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
