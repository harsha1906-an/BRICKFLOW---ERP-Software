const { getAll, getOne, run } = require('../config/db');

const PettyCash = {
    /**
     * Get or create petty cash account for project
     */
    getOrCreateAccount: async (projectId) => {
        let account = await getOne(
            'SELECT * FROM petty_cash_accounts WHERE project_id = ?',
            [projectId]
        );

        if (!account) {
            await run(
                `INSERT INTO petty_cash_accounts (project_id, opening_balance, current_balance) 
                 VALUES (?, 0, 0)`,
                [projectId]
            );
            account = await getOne(
                'SELECT * FROM petty_cash_accounts WHERE project_id = ?',
                [projectId]
            );
        }

        return account;
    },

    /**
     * Record a transaction (with database transaction for safety)
     */
    recordTransaction: async (data) => {
        const { getAll, getOne, runQuery, runTransaction } = require('../config/db');

        return await runTransaction(async () => {
            // Get current balance with row lock
            const account = await getOne(
                'SELECT * FROM petty_cash_accounts WHERE project_id = ?',
                [data.project_id]
            );

            if (!account) {
                // Create account if doesn't exist
                await runQuery(
                    `INSERT INTO petty_cash_accounts (project_id, opening_balance, current_balance) 
                     VALUES (?, 0, 0)`,
                    [data.project_id]
                );
            }

            const currentBalance = parseFloat(account?.current_balance || 0);
            let newBalance = currentBalance;

            // Calculate GST and base amount if applicable
            let base_amount = data.amount;
            let gst_amount = 0;

            if (data.has_gst && data.gst_percentage) {
                const { calculateGSTFromTotal } = require('../utils/gstHelper');
                const gstCalc = calculateGSTFromTotal(data.amount, data.gst_percentage);
                base_amount = gstCalc.base_amount;
                gst_amount = gstCalc.gst_amount;
            }

            // Calculate new balance
            if (data.type === 'disbursement') {
                newBalance -= parseFloat(data.amount);
            } else { // receipt or replenishment
                newBalance += parseFloat(data.amount);
            }

            // Insert transaction with GST fields
            const query = `
                INSERT INTO petty_cash_transactions (
                    project_id, user_id, transaction_date, type, amount, base_amount,
                    has_gst, gst_percentage, gst_amount, is_accountable,
                    category, description, receipt_number, approved_by, balance_after
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await runQuery(query, [
                data.project_id,
                data.user_id,
                data.transaction_date || new Date().toISOString().split('T')[0],
                data.type,
                data.amount,
                base_amount,
                data.has_gst ? 1 : 0,
                data.gst_percentage || 0,
                gst_amount,
                data.is_accountable !== undefined ? data.is_accountable : 1,
                data.category,
                data.description,
                data.receipt_number,
                data.approved_by,
                newBalance
            ]);

            // Update account balance
            await runQuery(
                `UPDATE petty_cash_accounts 
                 SET current_balance = ?,
                     ${data.type === 'replenishment' ? 'last_replenishment_date = ?, last_replenishment_amount = ?,' : ''}
                     updated_at = CURRENT_TIMESTAMP
                 WHERE project_id = ?`,
                data.type === 'replenishment'
                    ? [newBalance, data.transaction_date, data.amount, data.project_id]
                    : [newBalance, data.project_id]
            );

            return result.id;
        });
    },

    /**
     * Get transactions for a project
     */
    getTransactions: async (projectId, filters = {}) => {
        let query = `
            SELECT 
                pct.*,
                u.name as user_name,
                p.name as project_name,
                approver.name as approver_name
            FROM petty_cash_transactions pct
            JOIN users u ON pct.user_id = u.id
            JOIN projects p ON pct.project_id = p.id
            LEFT JOIN users approver ON pct.approved_by = approver.id
            WHERE pct.project_id = ?
        `;
        const params = [projectId];

        if (filters.type) {
            query += ` AND pct.type = ?`;
            params.push(filters.type);
        }

        if (filters.category) {
            query += ` AND pct.category = ?`;
            params.push(filters.category);
        }

        if (filters.startDate) {
            query += ` AND pct.transaction_date >= ?`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ` AND pct.transaction_date <= ?`;
            params.push(filters.endDate);
        }

        query += ` ORDER BY pct.transaction_date DESC, pct.created_at DESC`;

        return await getAll(query, params);
    },

    /**
     * Get current balance for a project
     */
    getBalance: async (projectId) => {
        const account = await PettyCash.getOrCreateAccount(projectId);
        return account;
    },

    /**
     * Get summary by category
     */
    getSummary: async (projectId, startDate = null, endDate = null) => {
        let query = `
            SELECT 
                category,
                SUM(CASE WHEN type = 'disbursement' THEN amount ELSE 0 END) as total_disbursed,
                COUNT(CASE WHEN type = 'disbursement' THEN 1 END) as disbursement_count
            FROM petty_cash_transactions
            WHERE project_id = ?
        `;
        const params = [projectId];

        if (startDate) {
            query += ` AND transaction_date >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND transaction_date <= ?`;
            params.push(endDate);
        }

        query += ` GROUP BY category`;

        return await getAll(query, params);
    }
};

module.exports = PettyCash;
