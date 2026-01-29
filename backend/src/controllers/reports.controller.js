const Reports = require('../models/reports.model');

// Get stock summary
const getStockSummary = async (req, res) => {
    try {
        const data = await Reports.getStockSummary();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get stock summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stock summary' });
    }
};

// Get material consumption
const getMaterialConsumption = async (req, res) => {
    try {
        const { project_id } = req.query;
        const data = await Reports.getMaterialConsumption(project_id);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get material consumption error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch material consumption' });
    }
};

// Get project costs
const getProjectCosts = async (req, res) => {
    try {
        const data = await Reports.getProjectCosts();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get project costs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch project costs' });
    }
};

// Get income vs expense
const getIncomeExpense = async (req, res) => {
    try {
        const data = await Reports.getIncomeExpense();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get income expense error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch income vs expense' });
    }
};

// Get project profit
const getProjectProfit = async (req, res) => {
    try {
        const data = await Reports.getProjectProfit();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get project profit error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch project profit' });
    }
};

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
    try {
        const data = await Reports.getDashboardSummary();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get dashboard summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
    }
};

// === FINANCIAL ANALYTICS ===
const getIncomeBreakdown = async (req, res) => {
    try {
        const data = await Reports.getIncomeBreakdown();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get income breakdown error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch income breakdown' });
    }
};

const getFinancialTimeline = async (req, res) => {
    try {
        const data = await Reports.getFinancialTimeline();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get financial timeline error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch financial timeline' });
    }
};

const getProfitTrend = async (req, res) => {
    try {
        const data = await Reports.getProfitTrend();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get profit trend error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profit trend' });
    }
};

// === PROJECT PROGRESS ANALYTICS ===
const getProjectProgress = async (req, res) => {
    try {
        const data = await Reports.getProjectProgress();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get project progress error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch project progress' });
    }
};

const getStageBottlenecks = async (req, res) => {
    try {
        const data = await Reports.getStageBottlenecks();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get stage bottlenecks error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stage bottlenecks' });
    }
};

// === CUSTOMER & PAYMENT ANALYTICS ===
const getPaymentStatusDistribution = async (req, res) => {
    try {
        const data = await Reports.getPaymentStatusDistribution();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get payment status distribution error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payment status distribution' });
    }
};

const getConversionFunnel = async (req, res) => {
    try {
        const data = await Reports.getConversionFunnel();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get conversion funnel error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch conversion funnel' });
    }
};

// === LABOUR & INVENTORY ANALYTICS ===
const getLabourCostTrend = async (req, res) => {
    try {
        const data = await Reports.getLabourCostTrend();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get labour cost trend error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch labour cost trend' });
    }
};

const getMaterialFlow = async (req, res) => {
    try {
        const data = await Reports.getMaterialFlow();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get material flow error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch material flow' });
    }
};

module.exports = {
    // Existing
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
};
