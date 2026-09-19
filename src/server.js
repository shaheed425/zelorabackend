const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const User = require('./models/User');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const migrationRoutes = require('./routes/migrationRoutes');

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin static images
}));

app.use(cors({
  origin: env.CLIENT_URL || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Public Static Assets (Uploaded/Migrated Images)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ZELORA Luxury Furniture API is running smoothly',
    timestamp: new Date(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/migration', migrationRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Initialize DB & Default Admin User
const startServer = async () => {
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

  app.listen(env.PORT, () => {
    console.log(`✨ ZELORA Backend Server running in ${process.env.NODE_ENV || 'development'} mode on port ${env.PORT}`);
  });
};

startServer();
