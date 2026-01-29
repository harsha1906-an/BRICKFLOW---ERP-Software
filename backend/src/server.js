require('dotenv').config();

// Validate environment variables before starting
const { validateEnvironment } = require('./utils/envValidator');
validateEnvironment();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const requestLogger = require('./middleware/logger');
const logger = require('./config/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { initDatabase } = require('./config/db');
const xssSanitizer = require('./middleware/xss');

// TEMPORARILY DISABLED - Optional services causing startup issues
// const { startDailyJob } = require('./services/schedulerService');
// const { scheduleBackups } = require('../scripts/backup');


// Import routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const unitRoutes = require('./routes/unit.routes');
const supplierRoutes = require('./routes/supplier.routes');
const materialRoutes = require('./routes/material.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const expenseRoutes = require('./routes/expense.routes');
const customerRoutes = require('./routes/customer.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const paymentMethodRoutes = require('./routes/paymentMethod.routes'); // Added
const reportsRoutes = require('./routes/reports.routes');
const labourRoutes = require('./routes/labour.routes');
const poRoutes = require('./routes/purchaseOrder.routes');
const approvalRoutes = require('./routes/approval.routes');
const unitProgressRoutes = require('./routes/unitProgress.routes');
const financeRoutes = require('./routes/finance.routes');
const auditRoutes = require('./routes/audit.routes');
const paymentRequestRoutes = require('./routes/paymentRequest.routes');
const pettyCashRoutes = require('./routes/pettyCash.routes');
const notificationRoutes = require('./routes/notification.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow for development
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for dev/demo usage
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limiting for auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // Relaxed for dev
    message: 'Too many login attempts, please try again later.'
});
app.use('/api/auth/login', authLimiter);

// CORS
// CORS
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.CORS_ORIGIN
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(xssSanitizer); // Sanitize inputs

// Request logging
app.use(requestLogger);

// Initialize database
initDatabase();
// TEMPORARILY DISABLED - causing startup failures
// startDailyJob();

// Start automated backups
// scheduleBackups();
logger.info('Server starting...', { port: PORT, env: process.env.NODE_ENV || 'development' });

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-methods', paymentMethodRoutes); // Registered
app.use('/api/reports', reportsRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/progress', unitProgressRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/payment-requests', paymentRequestRoutes);
app.use('/api/petty-cash', pettyCashRoutes);
app.use('/api/notifications', notificationRoutes);
// app.use('/api/admin', require('./routes/admin.routes'));

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
logger.info('Swagger docs available at /api-docs');

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'ERP Backend API',
        version: '1.0.0'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
// Start server only if run directly
if (require.main === module) {
    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
        console.error('UNHANDLED REJECTION! 💥 Shutting down...');
        console.error(err.name, err.message);
        console.error(err.stack);
        // In production, we might want to exit, but for dev stability, we log it
        // process.exit(1); 
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.error(err.name, err.message);
        console.error(err.stack);
        // process.exit(1);
    });

    const server = app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
    });
}

module.exports = app;
