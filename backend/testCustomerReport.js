require('module-alias/register');
const mongoose = require('mongoose');
const { globSync } = require('glob');
// pdfController required later to ensure models are loaded first
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// 1. Connect DB
mongoose.connect(process.env.DATABASE);

// 2. Load Models
const modelsFiles = globSync('./src/models/**/*.js');
for (const filePath of modelsFiles) {
    require(path.resolve(filePath));
}

async function testReport() {
    console.log('Testing Customer Report Generation...');
    try {
        const pdfController = require('./src/controllers/pdfController');
        const Model = mongoose.model('Client');
        const BookingModel = mongoose.model('Booking');

        // Logic from report.js
        const clients = await Model.find({ removed: false }).sort({ created: -1 });
        console.log(`Found ${clients.length} clients.`);

        const bookings = await BookingModel.find({ removed: false, status: { $ne: 'cancelled' } })
            .populate('villa', 'villaNumber')
            .select('client villa status');
        console.log(`Found ${bookings.length} active bookings.`);

        const bookingMap = {};
        bookings.forEach(b => {
            if (b.client && b.villa) {
                bookingMap[b.client.toString()] = b.villa.villaNumber;
            }
        });

        const reportData = {
            clients: clients.map(c => ({
                ...c.toObject(),
                villaNumber: bookingMap[c._id.toString()] || null
            }))
        };

        const pdfBuffer = await pdfController.generatePdf(
            'CustomerSummary',
            { filename: 'customer_summary', format: 'A4' },
            reportData
        );

        const outPath = path.resolve('customer_summary_test.pdf');
        fs.writeFileSync(outPath, pdfBuffer);
        console.log('SUCCESS: PDF generated at', outPath);
        process.exit(0);

    } catch (error) {
        console.error('ERROR OCCURRED:', error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

console.log('Starting Test Script...');
console.log('CWD:', process.cwd());

if (!process.env.DATABASE) {
    console.error('MISSING DATABASE ENV VAR');
} else {
    console.log('DATABASE Var is set.');
}

mongoose.connection.once('open', () => {
    console.log('DB Connected.');
    testReport();
});

mongoose.connection.on('error', (err) => {
    console.error('DB Connection Error:', err);
    process.exit(1);
});
