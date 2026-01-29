const { getAll, getOne, runQuery } = require('../config/db');
const Project = require('./project.model');

const Expense = {
    // Get all expenses with project info
    findAll: async (projectId = null, includeNonAccountable = false) => {
        try {
            let query = `
        SELECT 
          e.*,
          p.name as project_name
        FROM expenses e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE 1=1
      `;

            const params = [];

            // Filter by accountable if not including all
            if (!includeNonAccountable) {
                query += ' AND e.is_accountable = 1';
            }

            if (projectId) {
                query += ' AND e.project_id = ?';
                params.push(projectId);
            }

            query += ' ORDER BY e.expense_date DESC, e.created_at DESC';

            const expenses = await getAll(query, params);
            return expenses;
        } catch (error) {
            throw error;
        }
    },

    // Get expense by ID
    findById: async (id) => {
        try {
            const expense = await getOne(`
        SELECT 
          e.*,
          p.name as project_name
        FROM expenses e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.id = ?
      `, [id]);

            if (expense) {
                // Get related corrections if this is an original expense
                const corrections = await getAll(
                    'SELECT * FROM expenses WHERE corrects_expense_id = ? ORDER BY created_at',
                    [id]
                );
                expense.corrections = corrections;
            }

            return expense;
        } catch (error) {
            throw error;
        }
    },

    // Create new expense
    create: async (data) => {
        try {
            const {
                expense_date, project_id, category, amount, notes,
                base_amount, has_gst, gst_percentage, gst_amount, is_accountable
            } = data;

            const result = await runQuery(
                `INSERT INTO expenses (
                    expense_date, project_id, category, amount, base_amount,
                    has_gst, gst_percentage, gst_amount, is_accountable, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    expense_date, project_id, category, amount, base_amount || amount,
                    has_gst || 0, gst_percentage || 0, gst_amount || 0,
                    is_accountable !== undefined ? is_accountable : 1, notes
                ]
            );

            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Create correction entries for an expense
    createCorrection: async (id, newData) => {
        try {
            const originalExpense = await Expense.findById(id);

            if (!originalExpense) {
                throw new Error('Original expense not found');
            }

            const { expense_date, category, amount, notes } = newData;

            // Create reversal entry (negative amount)
            const reversalResult = await runQuery(
                `INSERT INTO expenses 
         (expense_date, project_id, category, amount, notes, is_correction, corrects_expense_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    originalExpense.expense_date,
                    originalExpense.project_id,
                    originalExpense.category,
                    -originalExpense.amount, // Negative to reverse
                    `Correction reversal for expense #${id}`,
                    1,
                    id
                ]
            );

            // Create new expense with corrected values
            const newExpenseResult = await runQuery(
                `INSERT INTO expenses 
         (expense_date, project_id, category, amount, notes) 
         VALUES (?, ?, ?, ?, ?)`,
                [expense_date, originalExpense.project_id, category, amount, notes]
            );

            return {
                reversalId: reversalResult.id,
                newExpenseId: newExpenseResult.id
            };
        } catch (error) {
            throw error;
        }
    },

    // Get expense summary by project and category
    getSummary: async (projectId = null, includeNonAccountable = false) => {
        try {
            let query = `
        SELECT 
          e.project_id,
          p.name as project_name,
          e.category,
          SUM(e.amount) as total_amount,
          COUNT(*) as expense_count
        FROM expenses e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE 1=1
      `;

            const params = [];

            if (!includeNonAccountable) {
                query += ' AND e.is_accountable = 1';
            }

            if (projectId) {
                query += ' AND e.project_id = ?';
                params.push(projectId);
            }

            query += ' GROUP BY e.project_id, p.name, e.category ORDER BY e.project_id, e.category';

            const summary = await getAll(query, params);
            return summary;
        } catch (error) {
            throw error;
        }
    },

    // Get total expenses by project
    getTotalByProject: async (projectId = null, includeNonAccountable = false) => {
        try {
            let query = `
        SELECT 
          e.project_id,
          p.name as project_name,
          SUM(CASE WHEN e.is_accountable = 1 THEN e.amount ELSE 0 END) as accountable_total,
          SUM(CASE WHEN e.is_accountable = 0 THEN e.amount ELSE 0 END) as non_accountable_total,
          SUM(e.amount) as total_expenses
        FROM expenses e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE 1=1
      `;

            const params = [];
            if (projectId) {
                query += ' AND e.project_id = ?';
                params.push(projectId);
            }

            query += ' GROUP BY e.project_id, p.name';

            const totals = await getAll(query, params);

            // Filter result based on includeNonAccountable
            return totals.map(t => ({
                ...t,
                total_expenses: includeNonAccountable ? t.total_expenses : t.accountable_total
            }));
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Expense;
