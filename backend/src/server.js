const app = require('./app');
const env = require('./config/env');
const { initDatabase } = require('./config/database');
const { seedInitialData } = require('../seeds/seed');

async function startServer() {
  try {
    console.log('[Server] Initializing Elder\'s Veil Comic Platform...');
    await initDatabase();
    await seedInitialData();

    // Admin accounts always have full Premium access. Safe to run on every deploy.
    const db = require('./config/database');
    if (db.isPgConnected()) {
      await db.query(`UPDATE users SET is_premium = TRUE, premium_status = 'active', premium_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE role = 'admin'`);
    } else {
      db.fallbackStore.users = (db.fallbackStore.users || []).map(u => u.role === 'admin' ? { ...u, is_premium: true, premium_status: 'active', premium_expires_at: null } : u);
      db.saveFallbackStore();
    }

    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 Web URL: http://localhost:${env.PORT}`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', () => {
      console.log('[Server] SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] Server closed.');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('[Server] Fatal Error during startup:', err);
    process.exit(1);
  }
}

startServer();
