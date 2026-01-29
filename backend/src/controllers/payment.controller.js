const Payment = require('../models/payment.model');
const { generatePaymentReceiptPDF } = require('../services/pdfService');

// Get all payments
const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll();
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
};

// Get payments by booking
const getPaymentsByBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const payments = await Payment.findByBooking(bookingId);

        res.json({ success: true, data: payments });
    } catch (error) {
        console.error('Get payments by booking error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
};

// Create payment
const createPayment = async (req, res) => {
    try {
        const { booking_id, payment_date, amount, payment_method, reference_number, notes } = req.body;

        if (!booking_id || !payment_date || !amount || !payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Booking, payment date, amount, and payment method are required'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        const result = await Payment.create({
            booking_id,
            payment_date,
            amount,
            payment_method,
            reference_number,
            notes,
            created_by: req.user.id // Add created_by for accountability
        });

        const response = {
            success: true,
            message: 'Payment recorded successfully',
            data: { id: result.id }
        };

        // Add overpayment warning if applicable
        if (result.overpayment.isOverpayment) {
            response.warning = {
                message: 'Overpayment detected',
                excessAmount: result.overpayment.excessAmount
            };
        }

        res.status(201).json(response);
    } catch (error) {
        console.error('Create payment error:', error);
        if (error.message === 'Booking not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to create payment' });
    }
};

// Check overpayment
const checkOverpayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        const overpaymentInfo = await Payment.checkOverpayment(bookingId, amount);

        res.json({ success: true, data: overpaymentInfo });
    } catch (error) {
        console.error('Check overpayment error:', error);
        res.status(500).json({ success: false, message: 'Failed to check overpayment' });
    }
};

// Get payment summary
const getPaymentSummary = async (req, res) => {
    try {
        const summary = await Payment.getSummary();
        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Get payment summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payment summary' });
    }
};

// Download payment receipt as PDF
const downloadReceiptPdf = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Generate and stream PDF
        generatePaymentReceiptPDF(payment, res);
    } catch (error) {
        console.error('Download receipt PDF error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate receipt' });
    }
};

// Get outstanding balance for a booking
const getOutstandingBalance = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const balanceInfo = await Payment.getOutstandingBalance(bookingId);

        res.json({ success: true, data: balanceInfo });
    } catch (error) {
        console.error('Get outstanding balance error:', error);
        if (error.message === 'Booking not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to fetch outstanding balance' });
    }
};

module.exports = {
    getAllPayments,
    getPaymentsByBooking,
    createPayment,
    checkOverpayment,
    getPaymentSummary,
    downloadReceiptPdf,
    getOutstandingBalance
};
