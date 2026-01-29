const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Mock data
const payment = {
    id: 999,
    amount: 100000,
    payment_date: '2024-02-01',
    payment_method: 'online',
    reference_number: 'TEST-REF-001',
    customer_name: 'Test Customer',
    unit_name: 'A-101',
    project_name: 'Test Project'
};

const generateReceipt = () => {
    console.log('Generating Receipt PDF...');
    const doc = new PDFDocument();
    const outputPath = path.join(__dirname, 'test_receipt.pdf');
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown();

    // Content
    doc.fontSize(12).text(`Receipt No: REC-${payment.id}`);
    doc.text(`Date: ${payment.payment_date}`);
    doc.moveDown();
    doc.text(`Received with thanks from: ${payment.customer_name}`);
    doc.text(`Amount: ₹${payment.amount.toLocaleString('en-IN')}`);
    doc.text(`For Unit: ${payment.unit_name} (${payment.project_name})`);
    doc.text(`Mode: ${payment.payment_method.toUpperCase()}`);
    doc.text(`Reference: ${payment.reference_number}`);

    doc.end();

    stream.on('finish', () => {
        console.log(`✅ PDF Generated successfully at: ${outputPath}`);
    });
};

generateReceipt();
