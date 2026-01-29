const { getAll, getOne, runQuery } = require('../config/db');

const ConstructionStage = {
    // Get all active construction stages
    findAll: async () => {
        try {
            const stages = await getAll(`
                SELECT id, name, weightage as default_percentage, sequence_order as stage_order
                FROM construction_stages
                WHERE 1=1
                ORDER BY sequence_order ASC
            `);
            return stages;
        } catch (error) {
            throw error;
        }
    },

    // Get stage by ID
    findById: async (id) => {
        try {
            const stage = await getOne(
                'SELECT * FROM construction_stages WHERE id = ? AND is_active = 1',
                [id]
            );
            return stage;
        } catch (error) {
            throw error;
        }
    },

    // Verify total percentage = 100%
    getTotalPercentage: async () => {
        try {
            const result = await getOne(
                'SELECT SUM(default_percentage) as total FROM construction_stages WHERE is_active = 1'
            );
            return result.total;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = ConstructionStage;
