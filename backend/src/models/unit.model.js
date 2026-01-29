const { getAll, getOne, runQuery } = require('../config/db');

const Unit = {
    // Get all units
    findAll: async () => {
        try {
            const units = await getAll(`
        SELECT u.*, p.name as project_name 
        FROM units u 
        LEFT JOIN projects p ON u.project_id = p.id 
        WHERE u.is_active = 1
        ORDER BY u.created_at DESC
      `);
            return units;
        } catch (error) {
            throw error;
        }
    },

    // Get units by project
    findByProject: async (projectId) => {
        try {
            const units = await getAll(
                'SELECT * FROM units WHERE project_id = ? AND is_active = 1 ORDER BY unit_number',
                [projectId]
            );
            return units;
        } catch (error) {
            throw error;
        }
    },

    // Get unit by ID
    findById: async (id) => {
        try {
            const unit = await getOne(`
        SELECT u.*, p.name as project_name 
        FROM units u 
        LEFT JOIN projects p ON u.project_id = p.id 
        WHERE u.id = ? AND u.is_active = 1
      `, [id]);
            return unit;
        } catch (error) {
            throw error;
        }
    },

    // Create new unit
    create: async (data) => {
        try {
            const { project_id, unit_number, type, price, status } = data;
            const result = await runQuery(
                'INSERT INTO units (project_id, unit_number, type, price, status) VALUES (?, ?, ?, ?, ?)',
                [project_id, unit_number, type, price, status]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Update unit
    update: async (id, data) => {
        try {
            const { unit_number, type, price, status } = data;
            await runQuery(
                'UPDATE units SET unit_number = ?, type = ?, price = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [unit_number, type, price, status, id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Delete unit
    delete: async (id) => {
        try {
            await runQuery('UPDATE units SET is_active = 0 WHERE id = ?', [id]);
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Count units by project
    countByProject: async (projectId) => {
        try {
            const result = await getOne('SELECT COUNT(*) as count FROM units WHERE project_id = ?', [projectId]);
            return result.count;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Unit;
