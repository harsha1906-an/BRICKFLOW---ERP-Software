const { getAll, getOne, runQuery } = require('../config/db');

const Inventory = {
    // Get all inventory transactions
    findAll: async () => {
        try {
            const transactions = await getAll(`
        SELECT 
          it.*,
          m.name as material_name,
          m.unit as material_unit,
          p.name as project_name
        FROM inventory_transactions it
        LEFT JOIN materials m ON it.material_id = m.id
        LEFT JOIN projects p ON it.project_id = p.id
        ORDER BY it.created_at DESC
      `);
            return transactions;
        } catch (error) {
            throw error;
        }
    },

    // Get transactions by material
    findByMaterial: async (materialId) => {
        try {
            const transactions = await getAll(`
        SELECT 
          it.*,
          m.name as material_name,
          m.unit as material_unit,
          p.name as project_name
        FROM inventory_transactions it
        LEFT JOIN materials m ON it.material_id = m.id
        LEFT JOIN projects p ON it.project_id = p.id
        WHERE it.material_id = ?
        ORDER BY it.created_at DESC
      `, [materialId]);
            return transactions;
        } catch (error) {
            throw error;
        }
    },

    // Get transactions by project
    findByProject: async (projectId) => {
        try {
            const transactions = await getAll(`
        SELECT 
          it.*,
          m.name as material_name,
          m.unit as material_unit
        FROM inventory_transactions it
        LEFT JOIN materials m ON it.material_id = m.id
        WHERE it.project_id = ?
        ORDER BY it.created_at DESC
      `, [projectId]);
            return transactions;
        } catch (error) {
            throw error;
        }
    },

    // Get current stock for a material (optional project filter)
    getCurrentStock: async (materialId, projectId = null) => {
        try {
            let query = `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END), 0) as current_stock
        FROM inventory_transactions
        WHERE material_id = ?
      `;
            const params = [materialId];

            if (projectId) {
                query += ' AND project_id = ?';
                params.push(projectId);
            }

            const result = await getOne(query, params);
            return result.current_stock;
        } catch (error) {
            throw error;
        }
    },

    // Get stock summary for all materials (optional project filter)
    getAllStock: async (projectId = null) => {
        try {
            let query = `
        SELECT 
          m.id,
          m.name,
          m.unit,
          COALESCE(SUM(CASE WHEN it.type = 'IN' THEN it.quantity ELSE 0 END), 0) as total_in,
          COALESCE(SUM(CASE WHEN it.type = 'OUT' THEN it.quantity ELSE 0 END), 0) as total_out,
          COALESCE(SUM(CASE WHEN it.type = 'IN' THEN it.quantity ELSE -it.quantity END), 0) as current_stock
        FROM materials m
        LEFT JOIN inventory_transactions it ON m.id = it.material_id
      `;
            const params = [];

            if (projectId) {
                query += ' AND it.project_id = ?';
                params.push(projectId);
            }

            query += `
        GROUP BY m.id, m.name, m.unit
        ORDER BY m.name
      `;

            const stock = await getAll(query, params);
            return stock;
        } catch (error) {
            throw error;
        }
    },

    // Create inventory transaction
    createTransaction: async (data) => {
        try {
            const { material_id, project_id, type, quantity, reference_type, reference_id, notes, usage_reason } = data;

            const result = await runQuery(
                'INSERT INTO inventory_transactions (material_id, project_id, type, quantity, reference_type, reference_id, notes, usage_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [material_id, project_id, type, quantity, reference_type, reference_id, notes, usage_reason]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Create multiple transactions (for purchase confirmation)
    createBulkTransactions: async (transactions) => {
        try {
            const ids = [];
            for (const txn of transactions) {
                const id = await Inventory.createTransaction(txn);
                ids.push(id);
            }
            return ids;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Inventory;
