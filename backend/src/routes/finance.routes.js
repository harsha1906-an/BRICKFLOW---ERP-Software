const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Schedule Routes
router.get('/schedule/:bookingId', financeController.getBookingSchedule);
router.post('/schedule/:bookingId/generate', financeController.generateEMISchedule);

// Loan Routes
router.post('/loans', financeController.addLoanDetails);
router.get('/loans/:bookingId', financeController.getBookingLoans);

module.exports = router;
