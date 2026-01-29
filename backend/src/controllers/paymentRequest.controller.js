const PaymentRequest = require('../models/paymentRequest.model');
const { sendEmail } = require('../services/emailService');

/**
 * Create a new payment request
 */
const createRequest = async (req, res) => {
    try {
        const { booking_id, customer_id, amount_requested, due_date, notes } = req.body;

        if (!booking_id || !customer_id || !amount_requested || !due_date) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const requestId = await PaymentRequest.create({
            booking_id,
            customer_id,
            amount_requested,
            due_date,
            notes,
            created_by: req.user.id,
            request_date: new Date().toISOString().split('T')[0]
        });

        // Get the created request with full details
        const request = await PaymentRequest.findById(requestId);

        // Optionally send email notification
        if (request.customer_email) {
            try {
                await sendEmail(
                    request.customer_email,
                    'Payment Request',
                    `Dear ${request.customer_name},\n\nThis is a payment request for ${request.unit_number} - ${request.project_name}.\n\nAmount: ₹${amount_requested}\nDue Date: ${due_date}\n\n${notes || ''}\n\nThank you.`
                );
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Payment request created successfully',
            data: request
        });
    } catch (error) {
        console.error('Create payment request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment request',
            error: error.message
        });
    }
};

/**
 * Get all payment requests
 */
const getAllRequests = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            customerId: req.query.customerId,
            bookingId: req.query.bookingId,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        // Update overdue requests first
        await PaymentRequest.updateOverdueRequests();

        const requests = await PaymentRequest.findAll(filters);

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Get payment requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment requests',
            error: error.message
        });
    }
};

/**
 * Get payment request by ID
 */
const getRequestById = async (req, res) => {
    try {
        const request = await PaymentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Payment request not found'
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Get payment request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment request',
            error: error.message
        });
    }
};

/**
 * Update payment request status
 */
const updateStatus = async (req, res) => {
    try {
        const { status, payment_id } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        await PaymentRequest.updateStatus(req.params.id, status, payment_id);

        res.json({
            success: true,
            message: 'Status updated successfully'
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
};

/**
 * Send reminder
 */
const sendReminder = async (req, res) => {
    try {
        const request = await PaymentRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Payment request not found'
            });
        }

        // Send email reminder
        if (request.customer_email) {
            await sendEmail(
                request.customer_email,
                'Payment Reminder',
                `Dear ${request.customer_name},\n\nThis is a reminder for the payment request for ${request.unit_number} - ${request.project_name}.\n\nAmount: ₹${request.amount_requested}\nDue Date: ${request.due_date}\n\nPlease make the payment at your earliest convenience.\n\nThank you.`
            );
        }

        // Update reminder count
        await PaymentRequest.sendReminder(req.params.id);

        res.json({
            success: true,
            message: 'Reminder sent successfully'
        });
    } catch (error) {
        console.error('Send reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reminder',
            error: error.message
        });
    }
};

module.exports = {
    createRequest,
    getAllRequests,
    getRequestById,
    updateStatus,
    sendReminder
};
