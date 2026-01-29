const { getAll } = require('../config/db');

const Audit = {
    /**
     * Find all audit logs with optional filters
     */
    findAll: async (filters = {}) => {
        let query = `
            SELECT 
                a.*,
                u.name as user_name,
                u.username
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.userId) {
            query += ` AND a.user_id = ?`;
            params.push(filters.userId);
        }

        if (filters.entityType) {
            query += ` AND a.entity_type = ?`;
            params.push(filters.entityType);
        }

        if (filters.entityId) {
            query += ` AND a.entity_id = ?`;
            params.push(filters.entityId);
        }

        if (filters.action) {
            query += ` AND a.action = ?`;
            params.push(filters.action);
        }

        if (filters.startDate) {
            query += ` AND DATE(a.timestamp) >= ?`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ` AND DATE(a.timestamp) <= ?`;
            params.push(filters.endDate);
        }

        query += ` ORDER BY a.timestamp DESC`;

        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(filters.limit);
        }

        if (filters.offset) {
            query += ` OFFSET ?`;
            params.push(filters.offset);
        }

        return await getAll(query, params);
    },

    /**
     * Find logs by entity
     */
    findByEntity: async (entityType, entityId) => {
        const query = `
            SELECT 
                a.*,
                u.name as user_name,
                u.username
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.entity_type = ? AND a.entity_id = ?
            ORDER BY a.timestamp DESC
        `;
        return await getAll(query, [entityType, entityId]);
    },

    /**
     * Find logs by user
     */
    findByUser: async (userId) => {
        const query = `
            SELECT 
                a.*,
                u.name as user_name,
                u.username
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.user_id = ?
            ORDER BY a.timestamp DESC
        `;
        return await getAll(query, [userId]);
    }
};

module.exports = Audit;
