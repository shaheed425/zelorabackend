const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const User = require('./models/User');

// Initialize DB & Default Admin User
const startServer = async () => {
  const PORT = env.PORT || 5000;

  // Listen immediately so port is open for incoming frontend proxy requests
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ ZELORA Backend Server running in ${process.env.NODE_ENV || 'development'} mode on http://127.0.0.1:${PORT}`);
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

startServer();

