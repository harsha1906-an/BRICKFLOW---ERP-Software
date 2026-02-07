const mongoose = require('mongoose');
const moment = require('moment');
const pdfController = require('@/controllers/pdfController');

const BookingModel = mongoose.model('Booking');

const report = async (Model, req, res) => {
    try {
        console.log('Generating Customer Report - Start');
        // 1. Fetch all non-removed clients
        const clients = await Model.find({ removed: false }).sort({ created: -1 });

        // 2. Fetch active bookings (or latest) to map Villas
        // We want to know which villa `client` has booked.
        // Booking has `client` (ObjectId) and `villa` (ObjectId).
        // We can fetch all bookings and create a map.
        const bookings = await BookingModel.find({ removed: false, status: { $ne: 'cancelled' } })
            .populate('villa', 'villaNumber')
            .select('client villa status');

        const bookingMap = {};
        bookings.forEach(b => {
            if (b.client && b.villa) {
                // If multiple, just overwrite (showing latest valid booking)
                bookingMap[b.client.toString()] = b.villa.villaNumber;
            }
        });

        // 3. Prepare data for PDF
        const reportData = {
            clients: clients.map(c => ({
                ...c.toObject(),
                villaNumber: bookingMap[c._id.toString()] || null
            }))
        };

        // 4. Generate PDF
        const pdfBuffer = await pdfController.generatePdf(
            'CustomerSummary',
            { filename: 'customer_summary', format: 'A4' },
            reportData
        );

        // 5. Send PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="customer_summary.pdf"',
            'Content-Length': pdfBuffer.length,
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Customer Report Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate report',
            error: error.message
        });
    }
};

module.exports = report;
