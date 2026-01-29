const express = require('express');
const router = express.Router();
const {
    getAllBookings,
    getBookingById,
    createBooking,
    updateBooking,
    getBookingBalance
} = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.get('/:id/balance', getBookingBalance);
router.post('/', createBooking);
router.put('/:id', updateBooking);

module.exports = router;
