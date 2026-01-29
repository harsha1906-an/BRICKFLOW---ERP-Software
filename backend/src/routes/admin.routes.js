const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get system dashboard metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics
 */
router.get('/dashboard', authMiddleware, roleCheck(['admin']), async (req, res) => {
    try {
        const stats = await monitoringService.getDashboardStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch metrics' });
    }
});

module.exports = router;
