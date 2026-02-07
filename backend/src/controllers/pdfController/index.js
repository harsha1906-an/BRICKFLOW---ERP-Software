const pug = require('pug');
const fs = require('fs');
const moment = require('moment');
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const { loadSettings } = require('@/middlewares/settings');
const useLanguage = require('@/locale/useLanguage');
const { useMoney, useDate } = require('@/settings');

const { getDailyReportData } = require('@/modules/LabourModule/reporting.service');

const pugFiles = ['invoice', 'offer', 'quote', 'payment', 'inventoryreport', 'paymentrequest', 'bookingreceipt', 'expensevoucher', 'pettycashreport', 'customersummary', 'dailyexpensereport', 'customerdetails', 'supplierdetails', 'bookingdetails', 'labourlist'];

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

exports.generatePdf = async (
  modelName,
  info = { filename: 'pdf_file', format: 'A5', targetLocation: '' },
  result,
  callback // Legacy support: ignored
) => {
  try {
    console.log('generatePdf (Buffer Mode) called for:', modelName);

    // NO FS OPERATIONS - Pure Buffer
    const normalizedModelName = modelName.toLowerCase();
    console.log(`generatePdf called for: '${modelName}' (normalized: '${normalizedModelName}')`);
    console.log(`Available pugFiles: ${JSON.stringify(pugFiles)}`);

    if (!pugFiles.includes(normalizedModelName)) {
      throw new Error(`Model '${modelName}' not found in allowed pugFiles list.`);
    }

    if (pugFiles.includes(normalizedModelName)) {
      // Compile Pug template
      const settings = await loadSettings();
      const selectedLang = settings['brickflow_app_language'];
      const translate = useLanguage({ selectedLang });

      const {
        currency_symbol = '₹',
        currency_position = 'before',
        decimal_sep = '.',
        thousand_sep = ',',
        cent_precision = 2,
        zero_format = false,
      } = settings;

      const { moneyFormatter } = useMoney({
        settings: {
          currency_symbol,
          currency_position,
          decimal_sep,
          thousand_sep,
          cent_precision: Number(cent_precision) || 2,
          zero_format,
        },
      });
      const { dateFormat } = useDate({ settings: { ...settings, dateFormat: settings.dateFormat || 'DD/MM/YYYY' } });

      const path = require('path');
      settings.public_server_file = process.env.PUBLIC_SERVER_FILE;

      const templatePath = path.resolve(__dirname, '../../pdf', modelName + '.pug');
      console.log('Template Path Resolved:', templatePath);
      if (!fs.existsSync(templatePath)) {
        console.error('CRITICAL: Template file not found at:', templatePath);
        throw new Error(`Template file not found: ${templatePath}`);
      }

      // Load Logo
      let logoBase64 = null;
      if (['bookingreceipt', 'expensevoucher', 'pettycashreport', 'dailyexpensereport', 'customerdetails', 'supplierdetails', 'bookingdetails'].includes(normalizedModelName)) {
        try {
          const logoPath = path.resolve(__dirname, '../../public/uploads/logo.png');
          if (fs.existsSync(logoPath)) {
            const logoBitmap = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoBitmap.toString('base64')}`;
          }
        } catch (err) {
          console.error('Error loading logo:', err);
        }
      }

      const htmlContent = pug.renderFile(templatePath, {
        model: result,
        result: result, // Add this alias because pug template might use 'model' or 'result' or fields directly
        ...result,     // Spread result properties to top level for easier access (e.g. items, date)
        settings,
        translate,
        dateFormat,
        moneyFormatter,
        moment: moment,
        logo: logoBase64,
        companyName: settings.company_name || 'BrickFlow'
      });
      console.log('PUG Rendered successfully. Launching Puppeteer...');

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreDefaultArgs: ['--disable-extensions'],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
      });
      console.log('Page Content Set. Generating PDF Buffer...');

      // Generate PDF as Buffer (no path option)
      const pdfBuffer = await page.pdf({
        format: info.format || 'A4',
        landscape: info.landscape === undefined ? false : info.landscape, // Default to Portrait for Daily Report (A4) unless specified
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      console.log('PDF Buffer Generated. Size:', pdfBuffer.length);

      await browser.close();
      console.log('Browser Closed.');

      return pdfBuffer;
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};

exports.downloadDailyReport = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { date } = req.query;

    console.log(`Generating Daily Expense Report PDF for Company: ${companyId}, Date: ${date}`);

    const result = await getDailyReportData(companyId, date);

    const rawPdf = await exports.generatePdf(
      'dailyExpenseReport',
      { format: 'A4', landscape: false },
      result
    );
    const pdfBuffer = Buffer.from(rawPdf);

    // DEBUG: Save to backend root for direct viewing
    const fs = require('fs');
    const path = require('path');
    const debugPath = path.resolve(__dirname, '../../debug_report.pdf');
    fs.writeFileSync(debugPath, pdfBuffer);
    console.log('Saved debug copy to:', debugPath);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="DailyReport_${result.date.replace(/\//g, '-')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating Daily Report PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};

exports.downloadCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const Client = mongoose.model('Client');
    const result = await Client.findById(id).lean();

    if (!result) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    console.log(`Generating Customer Details PDF for: ${result.name}`);

    const rawPdf = await exports.generatePdf(
      'customerDetails',
      { format: 'A4', landscape: false },
      result
    );
    const pdfBuffer = Buffer.from(rawPdf);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Customer_${result.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating Customer Details PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};

exports.downloadSupplierDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`downloadSupplierDetails called for ID: ${id}`);

    let Supplier;
    try {
      Supplier = mongoose.model('Supplier');
    } catch (e) {
      console.warn('Supplier model not found in mongoose registry, attempting to require...');
      Supplier = require('@/models/appModels/Supplier');
    }

    const result = await Supplier.findById(id).lean();

    if (!result) {
      console.error(`Supplier not found for ID: ${id}`);
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    console.log(`Generating Supplier Details PDF for: ${result.name}`);

    const rawPdf = await exports.generatePdf(
      'supplierDetails',
      { format: 'A4', landscape: false },
      result
    );
    const pdfBuffer = Buffer.from(rawPdf);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Supplier_${result.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating Supplier Details PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};

exports.downloadBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`downloadBookingDetails called for ID: ${id}`);

    const Booking = mongoose.model('Booking');
    const result = await Booking.findById(id).populate('client').populate('villa').lean();

    if (!result) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    console.log(`Generating Booking Details PDF for: ${result._id}`);

    const rawPdf = await exports.generatePdf(
      'bookingDetails',
      { format: 'A4', landscape: false },
      result
    );
    const pdfBuffer = Buffer.from(rawPdf);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Booking_${result.villaNumber || id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error in downloadBookingDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};

exports.downloadBookingReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { milestoneId } = req.query;
    console.log(`downloadBookingReceipt called for ID: ${id}, Milestone: ${milestoneId}`);

    const Booking = mongoose.model('Booking');
    const result = await Booking.findById(id).populate('client').populate('villa').lean();

    if (!result) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Find the specific milestone
    const milestone = result.paymentPlan.find(p => p._id.toString() === milestoneId);

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    // Override Booking fields with Milestone data for the receipt
    const { numberToWords } = require('@/helpers');

    // Create a context object specifically for the template
    const receiptContext = {
      ...result,
      bookingDate: milestone.paymentDate || milestone.dueDate || new Date(), // Use payment date
      downPayment: milestone.paidAmount || milestone.amount, // Use amount paid
      inWords: numberToWords(milestone.paidAmount || milestone.amount || 0),
      transactionId: milestone.transactionId || milestone.notes || result.transactionId || '-',
      paymentMethod: milestone.paymentMode || result.paymentMethod || 'Bank Transfer',
      // You might want to customize the "For" description in the template if possible, 
      // but the template hardcodes "Booking Advance for Plot No...". 
      // We might need to adjust the template or accept that text.  
      // For now, we reuse the template as requested.
    };

    console.log(`Generating Booking Receipt for Milestone: ${milestone.name}`);

    const rawPdf = await exports.generatePdf(
      'BookingReceipt', // Matches the pug file BookingReceipt.pug (case sensitive?? Windows is forgiving, Linux is not. File is BookingReceipt.pug)
      { format: 'A5', landscape: true },
      receiptContext
    );
    const pdfBuffer = Buffer.from(rawPdf);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Receipt_${milestone.name.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error in downloadBookingReceipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};

exports.downloadLabourList = async (req, res) => {
  try {
    const { company } = req.query; // Expect company ID in query if needed, or get it from headers/middleware
    console.log(`downloadLabourList called. Company: ${company}`);

    let Labour;
    try {
      Labour = mongoose.model('Labour');
    } catch (e) {
      console.warn('Labour model not found in mongoose registry, attempting to require...');
      Labour = require('@/models/appModels/Labour');
    }

    // Filter by company if provided, otherwise removed: false
    const query = { removed: false };
    if (company) {
      query.companyId = company;
    }

    const result = await Labour.find(query).sort({ name: 1 }).lean();

    console.log(`Generating Labour List PDF, count: ${result.length}`);

    const rawPdf = await exports.generatePdf(
      'labourList',
      { format: 'A4', landscape: false },
      result // Pass array as model
    );
    const pdfBuffer = Buffer.from(rawPdf);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Labour_List_Report.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error in downloadLabourList:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};
