const PDFDocument = require('pdfkit');

/**
 * Generate Purchase Order PDF
 */
const generatePurchaseOrderPDF = (orderData, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PO-${orderData.id}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('PURCHASE ORDER', { align: 'center' });
    doc.moveDown();

    // PO Details
    doc.fontSize(12);
    doc.text(`PO Number: ${orderData.po_number}`, { continued: false });
    doc.text(`Date: ${new Date(orderData.date).toLocaleDateString()}`);
    doc.text(`Supplier: ${orderData.supplier_name}`);
    doc.text(`Status: ${orderData.status}`);
    doc.moveDown();

    // Items Table Header
    doc.fontSize(10);
    const tableTop = doc.y;
    const tableLeft = 50;

    doc.font('Helvetica-Bold');
    doc.text('Item', tableLeft, tableTop, { width: 150, continued: true });
    doc.text('Quantity', tableLeft + 150, tableTop, { width: 80, continued: true });
    doc.text('Unit Price', tableLeft + 230, tableTop, { width: 80, continued: true });
    doc.text('Total', tableLeft + 310, tableTop, { width: 100 });

    doc.moveTo(tableLeft, doc.y).lineTo(tableLeft + 410, doc.y).stroke();
    doc.moveDown(0.5);

    // Items
    doc.font('Helvetica');
    let total = 0;

    orderData.items.forEach((item) => {
        const itemTotal = item.quantity * item.unit_price;
        total += itemTotal;

        const y = doc.y;
        doc.text(item.material_name || `Material ${item.material_id}`, tableLeft, y, { width: 150, continued: false });
        doc.text(item.quantity.toString(), tableLeft + 150, y, { width: 80, align: 'right', continued: false });
        doc.text(`₹${item.unit_price.toFixed(2)}`, tableLeft + 230, y, { width: 80, align: 'right', continued: false });
        doc.text(`₹${itemTotal.toFixed(2)}`, tableLeft + 310, y, { width: 100, align: 'right' });
        doc.moveDown(0.5);
    });

    doc.moveTo(tableLeft, doc.y).lineTo(tableLeft + 410, doc.y).stroke();
    doc.moveDown();

    // Total
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`Total Amount: ₹${total.toFixed(2)}`, { align: 'right' });

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica').text(
        'Thank you for your business!',
        { align: 'center' }
    );

    // Finalize PDF
    doc.end();
};

/**
 * Generate Payment Receipt PDF
 */
const generatePaymentReceiptPDF = (paymentData, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-${paymentData.id}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown(2);

    // Receipt Details
    doc.fontSize(12);
    doc.text(`Receipt Number: #${paymentData.id}`, { continued: false });
    doc.text(`Payment Date: ${new Date(paymentData.payment_date).toLocaleDateString()}`);
    doc.text(`Payment Method: ${paymentData.payment_method}`);
    if (paymentData.reference_number) {
        doc.text(`Reference: ${paymentData.reference_number}`);
    }
    doc.moveDown();

    // Customer & Booking Info
    doc.fontSize(11).font('Helvetica-Bold').text('Customer Information:');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Name: ${paymentData.customer_name}`);
    doc.text(`Phone: ${paymentData.customer_phone}`);
    if (paymentData.customer_email) {
        doc.text(`Email: ${paymentData.customer_email}`);
    }
    doc.moveDown();

    // Booking Details
    doc.fontSize(11).font('Helvetica-Bold').text('Booking Details:');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Unit: ${paymentData.unit_name || `Unit #${paymentData.unit_id}`}`);
    doc.text(`Total Amount: ₹${paymentData.total_amount?.toFixed(2) || 'N/A'}`);
    doc.text(`Paid Amount: ₹${paymentData.paid_amount?.toFixed(2) || 'N/A'}`);
    doc.text(`Outstanding: ₹${paymentData.outstanding?.toFixed(2) || 'N/A'}`);
    doc.moveDown(2);

    // Payment Amount Box
    doc.fontSize(14).font('Helvetica-Bold');
    doc.rect(50, doc.y, 500, 40).stroke();
    doc.text(`Amount Paid: ₹${paymentData.amount.toFixed(2)}`, 60, doc.y + 12, { align: 'left' });
    doc.moveDown(3);

    // Notes
    if (paymentData.notes) {
        doc.fontSize(10).font('Helvetica-Bold').text('Notes:');
        doc.font('Helvetica').text(paymentData.notes);
        doc.moveDown();
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica').text(
        'This is a computer-generated receipt and does not require a signature.',
        { align: 'center', color: 'gray' }
    );

    // Finalize PDF
    doc.end();
};

module.exports = {
    generatePurchaseOrderPDF,
    generatePaymentReceiptPDF,
};
