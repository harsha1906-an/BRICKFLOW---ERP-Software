const PettyCash = require('../models/pettyCash.model');

/**
 * Record a transaction
 */
const recordTransaction = async (req, res) => {
    try {
        const { project_id, type, amount, category, description, receipt_number, transaction_date } = req.body;

        if (!project_id || !type || !amount || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        if (type === 'disbursement' && !category) {
            return res.status(400).json({
                success: false,
                message: 'Category is required for disbursements'
            });
        }

        // Check if balance is sufficient for disbursement
        if (type === 'disbursement') {
            const account = await PettyCash.getBalance(project_id);
            if (parseFloat(account.current_balance) < parseFloat(amount)) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient petty cash balance'
                });
            }
        }

        const transactionId = await PettyCash.recordTransaction({
            project_id,
            user_id: req.user.id,
            type,
            amount,
            category,
            description,
            receipt_number,
            transaction_date,
            approved_by: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Transaction recorded successfully',
            data: { id: transactionId }
        });
    } catch (error) {
        console.error('Record transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record transaction',
            error: error.message
        });
    }
};

/**
 * Get transactions for a project
 */
const getProjectTransactions = async (req, res) => {
    try {
        const { projectId } = req.params;
        const filters = {
            type: req.query.type,
            category: req.query.category,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const transactions = await PettyCash.getTransactions(projectId, filters);

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
            error: error.message
        });
    }
};

/**
 * Get balance for a project
 */
const getBalance = async (req, res) => {
    try {
        const { projectId } = req.params;
        const account = await PettyCash.getBalance(projectId);

        res.json({
            success: true,
            data: account
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch balance',
            error: error.message
        });
    }
};

/**
 * Replenish petty cash
 */
const replenishCash = async (req, res) => {
    try {
        const { project_id, amount, description, receipt_number } = req.body;

        if (!project_id || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Project ID and amount are required'
            });
        }

        const transactionId = await PettyCash.recordTransaction({
            project_id,
            user_id: req.user.id,
            type: 'replenishment',
            amount,
            category: null,
            description: description || 'Cash replenishment',
            receipt_number,
            transaction_date: new Date().toISOString().split('T')[0],
            approved_by: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Cash replenished successfully',
            data: { id: transactionId }
        });
    } catch (error) {
        console.error('Replenish cash error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to replenish cash',
            error: error.message
        });
    }
};

/**
 * Get summary by category
 */
const getSummary = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, endDate } = req.query;

        const summary = await PettyCash.getSummary(projectId, startDate, endDate);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch summary',
            error: error.message
        });
    }
};

module.exports = {
    recordTransaction,
    getProjectTransactions,
    getBalance,
    replenishCash,
    getSummary
};
