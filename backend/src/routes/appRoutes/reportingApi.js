const express = require('express');
const router = express.Router();
const { generateDailySummary } = require('@/modules/LabourModule/reporting.service');
const { catchErrors } = require('@/handlers/errorHandlers');

router.get('/companies/:companyId/daily-summary', catchErrors(async (req, res) => {
    const { date } = req.query;
    const { companyId } = req.params;
    const summary = await generateDailySummary(companyId, date);
    res.json(summary);
}));

const pdfController = require('@/controllers/pdfController');
router.get('/companies/:companyId/daily-report-pdf', catchErrors(pdfController.downloadDailyReport));
router.get('/customer/:id/pdf-details', catchErrors(pdfController.downloadCustomerDetails));
router.get('/supplier/:id/pdf-details', catchErrors(pdfController.downloadSupplierDetails));
router.get('/booking/:id/pdf-details', catchErrors(pdfController.downloadBookingDetails));
router.get('/booking/:id/pdf-receipt', catchErrors(pdfController.downloadBookingReceipt));
router.get('/labour/pdf-list', catchErrors(pdfController.downloadLabourList));
router.get('/expense/pdf-report/:companyId', catchErrors(pdfController.downloadExpenseReport));

module.exports = router;
