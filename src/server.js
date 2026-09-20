const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const User = require('./models/User');

// Handle uncaught exceptions and unhandled promise rejections safely
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
});

// Initialize DB & Default Admin User
const startServer = async () => {
  const PORT = env.PORT || 5000;

  // Listen immediately so port is open for incoming frontend proxy requests
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ ZELORA Backend Server running in ${process.env.NODE_ENV || 'development'} mode on http://127.0.0.1:${PORT}`);
    startKeepAlivePing(PORT);
  });

  await connectDB();

  try {
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (!adminExists) {
      await User.create({
        name: 'ZELORA Administrator',
        email: 'admin@zelora.com',
        password: 'admin123login',
        role: 'ADMIN',
        phone: '+91 9778541486',
      });
      console.log('✅ Default Admin Created: admin@zelora.com / admin123login');
    }
  } catch (err) {
    console.warn('Admin check skipped/failed:', err.message);
  }
};

// Automatic Anti-Sleep Self-Ping Mechanism (Pings every 8 minutes)
const startKeepAlivePing = (port) => {
  const intervalMs = 8 * 60 * 1000; // 8 minutes

  setInterval(() => {
    try {
      const liveUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || `http://127.0.0.1:${port}/api/health`;
      const httpModule = liveUrl.startsWith('https') ? require('https') : require('http');
      httpModule.get(liveUrl, (res) => {
        // Keep alive ping successful
      }).on('error', () => {});
    } catch (err) {}
  }, intervalMs);
};

startServer();

