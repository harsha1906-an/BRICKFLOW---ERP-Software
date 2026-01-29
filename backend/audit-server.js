// Simplified server for audit testing - removes optional services
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const requestLogger = require('./src/middleware/logger');
const logger = require('./src/config/logger');
const { initDatabase } = require('./src/config/db');
const xssSanitizer = require('./src/middleware/xss');

// Import routes
const healthRoutes = require('./src/routes/health.routes');
const authRoutes = require('./src/routes/auth.routes');
const projectRoutes = require('./src/routes/project.routes');
const unitRoutes = require('./src/routes/unit.routes');
const supplierRoutes = require('./src/routes/supplier.routes');
const materialRoutes = require('./src/routes/material.routes');
const inventoryRoutes = require('./src/routes/inventory.routes');
const purchaseRoutes = require('./src/routes/purchase.routes');
const expenseRoutes = require('./src/routes/expense.routes');
const customerRoutes = require('./src/routes/customer.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const paymentMethodRoutes = require('./src/routes/paymentMethod.routes');
const reportsRoutes = require('./src/routes/reports.routes');
const labourRoutes = require('./src/routes/labour.routes');
const poRoutes = require('./src/routes/purchaseOrder.routes');
const approvalRoutes = require('./src/routes/approval.routes');
const unitProgressRoutes = require('./src/routes/unitProgress.routes');
const financeRoutes = require('./src/routes/finance.routes');
const auditRoutes = require('./src/routes/audit.routes');
const paymentRequestRoutes = require('./src/routes/paymentRequest.routes');
const pettyCashRoutes = require('./src/routes/pettyCash.routes');
const notificationRoutes = require('./src/routes/notification.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Relaxed for audit testing
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(xssSanitizer);

// Request logging
app.use(requestLogger);

// Initialize database
initDatabase(); console.log('✅ Database initialized');

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
app.use('/api/payment-methods', paymentMethodRoutes);
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

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'ERP Backend API - AUDIT MODE',
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
const server = app.listen(PORT, () => {
    console.log(`\n🚀 AUDIT MODE SERVER RUNNING`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Frontend: http://localhost:5173\n`);
});

module.exports = app;
