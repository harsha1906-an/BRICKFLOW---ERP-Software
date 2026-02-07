require('module-alias/register');
const custom = require('./src/controllers/pdfController');
const fs = require('fs');
const path = require('path');

async function testLive() {
    console.log('Testing live PDF generation...');

    const mockResult = {
        _id: '6982fc3103c05a39e8f1da6e',
        number: 'TEST-001',
        date: new Date(),
        recipientType: 'Labour',
        amount: 50000,
        inWords: 'Fifty Thousand',
        description: 'Test Payment for Labour',
        paymentMode: 'Cash'
    };

    try {
        const pdfBuffer = await custom.generatePdf(
            'ExpenseVoucher',
            { filename: 'test', format: 'A5' },
            mockResult
        );

        const outputPath = path.resolve(__dirname, 'src/public/download/test_live.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log('Success! Test PDF generated at:', outputPath);
        console.log('Buffer size:', pdfBuffer.length);
    } catch (err) {
        console.error('FAILED to generate PDF:', err);
    }
}

testLive();
