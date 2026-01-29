const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// GET /api/health - Health check endpoint
router.get('/', (req, res) => {
    // Check database connection
    db.get('SELECT 1', (err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                status: 'error',
                message: 'Database connection failed',
                database: 'disconnected'
            });
        }

        res.json({
            success: true,
            status: 'ok',
            message: 'Server is running',
            database: 'connected'
        });
    });
});

module.exports = router;
