const { getAll } = require('../config/db');

const getSuppliers = async (req, res) => {
    try {
        const suppliers = await getAll('SELECT * FROM suppliers ORDER BY name');
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getSuppliers
};
