const Booking = require('../models/booking.model');

// Get all bookings
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll();
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
};

// Get booking by ID
const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch booking' });
    }
};

// Create booking
const createBooking = async (req, res) => {
    try {
        const { customer_id, unit_id, booking_date, agreed_price, notes } = req.body;

        if (!customer_id || !unit_id || !booking_date || !agreed_price) {
            return res.status(400).json({
                success: false,
                message: 'Customer, unit, booking date, and agreed price are required'
            });
        }

        if (agreed_price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Agreed price must be greater than 0'
            });
        }

        const bookingId = await Booking.create({
            customer_id,
            unit_id,
            booking_date,
            agreed_price,
            notes
        });

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: { id: bookingId }
        });
    } catch (error) {
        console.error('Create booking error:', error);
        if (error.message === 'Unit not found' || error.message === 'Unit is not available for booking') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to create booking' });
    }
};

// Update booking
const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { booking_date, agreed_price, status, notes } = req.body;

        if (!booking_date || !agreed_price || !status) {
            return res.status(400).json({
                success: false,
                message: 'Booking date, agreed price, and status are required'
            });
        }

        await Booking.update(id, { booking_date, agreed_price, status, notes });

        res.json({ success: true, message: 'Booking updated successfully' });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ success: false, message: 'Failed to update booking' });
    }
};

// Get booking balance
const getBookingBalance = async (req, res) => {
    try {
        const { id } = req.params;
        const balanceInfo = await Booking.getBalance(id);

        res.json({ success: true, data: balanceInfo });
    } catch (error) {
        console.error('Get booking balance error:', error);
        if (error.message === 'Booking not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to fetch booking balance' });
    }
};

module.exports = {
    getAllBookings,
    getBookingById,
    createBooking,
    updateBooking,
    getBookingBalance
};
