const Audit = require('../models/audit.model');

/**
 * Get all audit logs with filters
 */
const getAllLogs = async (req, res) => {
    try {
        const filters = {
            userId: req.query.userId,
            entityType: req.query.entityType,
            entityId: req.query.entityId,
            action: req.query.action,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            limit: parseInt(req.query.limit) || 100,
            offset: parseInt(req.query.offset) || 0
        };

        const logs = await Audit.findAll(filters);

        res.json({
            success: true,
            data: logs,
            filters: filters
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs',
            error: error.message
        });
    }
};

/**
 * Get logs for a specific entity
 */
const getLogsByEntity = async (req, res) => {
    try {
        const { type, id } = req.params;
        const logs = await Audit.findByEntity(type, id);

        res.json({
            success: true,
            data: logs,
            entity: { type, id }
        });
    } catch (error) {
        console.error('Get entity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch entity logs',
            error: error.message
        });
    }
};

/**
 * Get logs for a specific user
 */
const getLogsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const logs = await Audit.findByUser(userId);

        res.json({
            success: true,
            data: logs,
            userId
        });
    } catch (error) {
        console.error('Get user logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user logs',
            error: error.message
        });
    }
};

module.exports = {
    getAllLogs,
    getLogsByEntity,
    getLogsByUser
};
