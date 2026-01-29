const express = require('express');
const router = express.Router();
const paymentRequestController = require('../controllers/paymentRequest.controller');
const authenticate = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Create payment request
router.post('/', paymentRequestController.createRequest);

// Get all payment requests
router.get('/', paymentRequestController.getAllRequests);

// Get payment request by ID
router.get('/:id', paymentRequestController.getRequestById);

// Update payment request status
router.put('/:id/status', paymentRequestController.updateStatus);

// Send reminder
router.post('/:id/remind', paymentRequestController.sendReminder);

module.exports = router;
