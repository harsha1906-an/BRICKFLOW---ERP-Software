const { getAll, getOne, runQuery } = require('../config/db');

const Supplier = {
    // Get all suppliers
    findAll: async () => {
        try {
            const suppliers = await getAll('SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name');
            return suppliers;
        } catch (error) {
            throw error;
        }
    },

    // Get supplier by ID
    findById: async (id) => {
        try {
            const supplier = await getOne('SELECT * FROM suppliers WHERE id = ? AND is_active = 1', [id]);
            return supplier;
        } catch (error) {
            throw error;
        }
    },

    // Create new supplier
    create: async (data) => {
        try {
            const { name, contact_person, phone, email, address } = data;
            const result = await runQuery(
                'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
                [name, contact_person, phone, email, address]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Update supplier
    update: async (id, data) => {
        try {
            const { name, contact_person, phone, email, address } = data;
            await runQuery(
                'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, contact_person, phone, email, address, id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Delete supplier
    delete: async (id) => {
        try {
            await runQuery('UPDATE suppliers SET is_active = 0 WHERE id = ?', [id]);
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Check if supplier has purchases
    hasPurchases: async (id) => {
        try {
            const result = await getOne('SELECT COUNT(*) as count FROM purchases WHERE supplier_id = ?', [id]);
            return result.count > 0;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Supplier;
