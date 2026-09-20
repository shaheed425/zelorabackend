const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

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
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body Parsers (Increased to 50mb for handling multiple image uploads)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve Public Static Assets
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health check endpoint (Keep-Alive Anti-Sleep Ping Target)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ZELORA Luxury Furniture API is running smoothly',
    status: 'ACTIVE_NO_SLEEP',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint for Vercel health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ZELORA Backend API is live on Vercel',
    documentation: '/api/health',
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

module.exports = app;
