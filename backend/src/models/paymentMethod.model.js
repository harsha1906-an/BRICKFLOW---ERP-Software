const { getAll, getOne, runQuery } = require('../config/db');

const PaymentMethod = {
    findAll: async () => {
        return await getAll('SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY name');
    },

    findByCode: async (code) => {
        return await getOne('SELECT * FROM payment_methods WHERE code = ?', [code]);
    },

    findById: async (id) => {
        return await getOne('SELECT * FROM payment_methods WHERE id = ?', [id]);
    }
};

module.exports = PaymentMethod;
