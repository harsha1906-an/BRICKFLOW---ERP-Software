const Expense = require('../models/expense.model');
const Project = require('../models/project.model');
const { calculateGST, validateGSTPercentage } = require('../utils/gstHelper');

// Get all expenses
const getAllExpenses = async (req, res) => {
    try {
        const { project_id, include_non_accountable } = req.query;
        const includeNonAccountable = include_non_accountable === 'true';
        const expenses = await Expense.findAll(project_id, includeNonAccountable);
        res.json({ success: true, data: expenses });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
    }
};

// Get expense by ID
const getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        res.json({ success: true, data: expense });
    } catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch expense' });
    }
};

// Create expense
const createExpense = async (req, res) => {
    try {
        const {
            expense_date, project_id, category, amount, notes,
            has_gst, gst_percentage, is_accountable
        } = req.body;

        // Validation
        if (!expense_date || !project_id || !category || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Expense date, project, category, and amount are required'
            });
        }

        if (amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be non-negative'
            });
        }

        // Validate GST if applicable
        if (has_gst && gst_percentage && !validateGSTPercentage(gst_percentage)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GST percentage. Must be one of: 0, 5, 12, 18, 28'
            });
        }

        // Check if project exists
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Calculate GST if applicable
        let expenseData = {
            expense_date,
            project_id,
            category,
            notes,
            is_accountable: is_accountable !== undefined ? is_accountable : 1
        };

        if (has_gst && gst_percentage && gst_percentage > 0) {
            const gstCalc = calculateGST(amount, gst_percentage);
            expenseData.base_amount = gstCalc.base_amount;
            expenseData.has_gst = 1;
            expenseData.gst_percentage = gst_percentage;
            expenseData.gst_amount = gstCalc.gst_amount;
            expenseData.amount = gstCalc.total_amount;
        } else {
            expenseData.base_amount = amount;
            expenseData.amount = amount;
            expenseData.has_gst = 0;
            expenseData.gst_percentage = 0;
            expenseData.gst_amount = 0;
        }

        const expenseId = await Expense.create(expenseData);

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: { id: expenseId }
        });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ success: false, message: 'Failed to create expense' });
    }
};

// Create correction for an expense
const correctExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { expense_date, category, amount, notes } = req.body;

        // Validation
        if (!expense_date || !category || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Expense date, category, and amount are required'
            });
        }

        if (amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be non-negative'
            });
        }

        const result = await Expense.createCorrection(id, {
            expense_date,
            category,
            amount,
            notes
        });

        res.json({
            success: true,
            message: 'Correction entries created successfully',
            data: result
        });
    } catch (error) {
        console.error('Correct expense error:', error);
        if (error.message === 'Original expense not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to create correction' });
    }
};

// Get expense summary
const getExpenseSummary = async (req, res) => {
    try {
        const { project_id, include_non_accountable } = req.query;
        const includeNonAccountable = include_non_accountable === 'true';
        const summary = await Expense.getSummary(project_id, includeNonAccountable);
        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Get expense summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch expense summary' });
    }
};

// Get total expenses by project
const getTotalByProject = async (req, res) => {
    try {
        const { project_id, include_non_accountable } = req.query;
        const includeNonAccountable = include_non_accountable === 'true';
        const totals = await Expense.getTotalByProject(project_id, includeNonAccountable);
        res.json({ success: true, data: totals });
    } catch (error) {
        console.error('Get expense totals error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch expense totals' });
    }
};

module.exports = {
    getAllExpenses,
    getExpenseById,
    createExpense,
    correctExpense,
    getExpenseSummary,
    getTotalByProject
};
