const express = require('express');
const router = express.Router();
const {
    getStockSummary,
    getMaterialConsumption,
    getProjectCosts,
    getIncomeExpense,
    getProjectProfit,
    getDashboardSummary,
    // Financial Analytics
    getIncomeBreakdown,
    getFinancialTimeline,
    getProfitTrend,
    // Project Progress
    getProjectProgress,
    getStageBottlenecks,
    // Customer & Payment
    getPaymentStatusDistribution,
    getConversionFunnel,
    // Labour & Inventory
    getLabourCostTrend,
    getMaterialFlow
} = require('../controllers/reports.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Existing report endpoints
router.get('/stock-summary', getStockSummary);
router.get('/material-consumption', getMaterialConsumption);
router.get('/project-costs', getProjectCosts);
router.get('/income-expense', getIncomeExpense);
router.get('/project-profit', getProjectProfit);
router.get('/dashboard-summary', getDashboardSummary);

// Financial Analytics
router.get('/income-breakdown', getIncomeBreakdown);
router.get('/financial-timeline', getFinancialTimeline);
router.get('/profit-trend', getProfitTrend);

// Project Progress Analytics
router.get('/project-progress', getProjectProgress);
router.get('/stage-bottlenecks', getStageBottlenecks);

// Customer & Payment Analytics
router.get('/payment-status-distribution', getPaymentStatusDistribution);
router.get('/conversion-funnel', getConversionFunnel);

// Labour & Inventory Analytics
router.get('/labour-cost-trend', getLabourCostTrend);
router.get('/material-flow', getMaterialFlow);

module.exports = router;
