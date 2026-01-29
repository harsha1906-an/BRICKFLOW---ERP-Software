const { getAll, getOne, runQuery } = require('../config/db');

const Material = {
    // Get all materials
    findAll: async () => {
        try {
            const materials = await getAll('SELECT * FROM materials WHERE is_active = 1 ORDER BY name');
            return materials;
        } catch (error) {
            throw error;
        }
    },

    // Get material by ID
    findById: async (id) => {
        try {
            const material = await getOne('SELECT * FROM materials WHERE id = ? AND is_active = 1', [id]);
            return material;
        } catch (error) {
            throw error;
        }
    },

    // Create new material
    create: async (data) => {
        try {
            const { name, unit } = data;
            const result = await runQuery(
                'INSERT INTO materials (name, unit) VALUES (?, ?)',
                [name, unit]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Update material
    update: async (id, data) => {
        try {
            const { name, unit } = data;
            await runQuery(
                'UPDATE materials SET name = ?, unit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, unit, id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Delete material
    delete: async (id) => {
        try {
            await runQuery('UPDATE materials SET is_active = 0 WHERE id = ?', [id]);
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Check if material has transactions
    hasTransactions: async (id) => {
        try {
            const result = await getOne('SELECT COUNT(*) as count FROM inventory_transactions WHERE material_id = ?', [id]);
            return result.count > 0;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Material;
