const express = require('express');
const router = express.Router();
const PaymentMethod = require('../models/paymentMethod.model');

router.get('/', async (req, res) => {
    try {
        const methods = await PaymentMethod.findAll();
        res.json({ success: true, data: methods });
    } catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payment methods' });
    }
});

module.exports = router;
