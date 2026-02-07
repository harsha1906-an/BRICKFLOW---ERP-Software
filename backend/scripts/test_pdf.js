
require('dotenv').config({ path: '.env' });
const path = require('path');
require('module-alias').addAlias('@', path.join(__dirname, '../src'));
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE);

// Load Models
require('../src/models/appModels/Expense');
require('../src/models/appModels/PettyCashTransaction');
require('../src/models/appModels/Attendance');
require('../src/models/appModels/Labour');
require('../src/models/appModels/Supplier');
require('../src/models/appModels/Villa');
require('../src/models/appModels/Payment');
require('../src/models/appModels/Client');

const { getDailyReportData } = require('../src/modules/LabourModule/reporting.service');
const pdfController = require('../src/controllers/pdfController');
const fs = require('fs');

async function testPdf() {
    try {
        console.log('--- Starting PDF Debug ---');

        // Mock Data
        const companyId = '679c670b13501a350c371074'; // Reusing id from previous context or finding one
        const date = '2026-02-06';

        console.log('1. Fetching Data...');
        const result = await getDailyReportData(companyId, date);
        console.log('Data fetched. Items:', result.items.length);
        console.log('Sample Item:', result.items[0]);

        console.log('2. Generating PDF...');
        const pdfBuffer = await pdfController.generatePdf(
            'dailyExpenseReport',
            { format: 'A4', landscape: false },
            result
        );

        console.log('3. PDF Generated. Size:', pdfBuffer.length);
        fs.writeFileSync('debug_report.pdf', pdfBuffer);
        console.log('Saved to debug_report.pdf');

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        mongoose.disconnect();
    }
}

testPdf();
