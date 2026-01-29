const { runQuery } = require('../config/db');

/**
 * Audit Service
 * Handles logging of critical system changes
 */
const AuditService = {
    /**
     * Log an action
     * @param {number} userId - ID of the user performing action (optional)
     * @param {string} action - Action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
     * @param {string} entityType - Entity being affected (projects, customers, etc.)
     * @param {number} entityId - ID of the entity
     * @param {object} oldValues - Previous state (for updates/deletes)
     * @param {object} newValues - New state (for updates/creates)
     * @param {object} req - Express request object (to extract IP/Agent)
     */
    log: async (userId, action, entityType, entityId, oldValues, newValues, req = null) => {
        try {
            const ipAddress = req ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : null;
            const userAgent = req ? req.headers['user-agent'] : null;

            await runQuery(
                `INSERT INTO audit_logs 
                (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId || null,
                    action,
                    entityType,
                    entityId,
                    oldValues ? JSON.stringify(oldValues) : null,
                    newValues ? JSON.stringify(newValues) : null,
                    ipAddress,
                    userAgent
                ]
            );
        } catch (error) {
            console.error('Audit Log Error:', error);
            // Don't throw, we don't want to break the main flow if logging fails
        }
    }
};

module.exports = AuditService;
