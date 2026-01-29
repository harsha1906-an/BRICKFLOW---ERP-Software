const PaymentSchedule = require('../models/schedule.model');
const CustomerLoan = require('../models/loan.model');

// --- Schedule Methods ---

const getBookingSchedule = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const schedule = await PaymentSchedule.getByBookingId(bookingId);
        res.json({ success: true, data: schedule });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const generateEMISchedule = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { totalAmount, months, startDate, interestRate } = req.body;

        await PaymentSchedule.generateEMI(bookingId, totalAmount, months, startDate, interestRate);
        res.json({ success: true, message: 'EMI Schedule Generated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Loan Methods ---

const addLoanDetails = async (req, res) => {
    try {
        const id = await CustomerLoan.create(req.body); // body has booking_id, bank_name etc.
        res.status(201).json({ success: true, data: { id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getBookingLoans = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const loans = await CustomerLoan.getByBookingId(bookingId);
        res.json({ success: true, data: loans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getBookingSchedule,
    generateEMISchedule,
    addLoanDetails,
    getBookingLoans
};
