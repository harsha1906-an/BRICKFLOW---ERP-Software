const express = require('express');
const router = express.Router();
const { getMonthlySummary } = require('@/controllers/appControllers/analyticsController');
const { catchErrors } = require('@/handlers/errorHandlers');

// Get monthly analytics summary (income vs expenses)
router.get('/monthly-summary', catchErrors(getMonthlySummary));

module.exports = router;
