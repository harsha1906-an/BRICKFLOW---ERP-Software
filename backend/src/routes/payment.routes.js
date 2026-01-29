const express = require('express');
const router = express.Router();
const {
    getAllPayments,
    getPaymentsByBooking,
    createPayment,
    checkOverpayment,
    getPaymentSummary,
    downloadReceiptPdf,
    getOutstandingBalance
} = require('../controllers/payment.controller');
const roleCheck = require('../middleware/roleCheck');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Summary and special routes first
router.get('/summary', roleCheck(['ADMIN']), getPaymentSummary);
router.get('/booking/:bookingId', getPaymentsByBooking);
router.get('/balance/:bookingId', getOutstandingBalance);
router.post('/check-overpayment/:bookingId', roleCheck(['ADMIN']), checkOverpayment);
router.get('/:id/pdf', downloadReceiptPdf);

// Standard CRUD
router.get('/', getAllPayments);
router.post('/', roleCheck(['ADMIN']), createPayment);

module.exports = router;
