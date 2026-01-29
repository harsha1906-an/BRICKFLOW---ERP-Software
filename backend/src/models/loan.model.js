const { getAll, runQuery, getOne } = require('../config/db');

const CustomerLoan = {
    // Create new loan record
    create: async (data) => {
        try {
            const { booking_id, bank_name, loan_account_number, sanctioned_amount, status } = data;
            const result = await runQuery(
                `INSERT INTO customer_loans (booking_id, bank_name, loan_account_number, sanctioned_amount, status) 
                 VALUES (?, ?, ?, ?, ?)`,
                [booking_id, bank_name, loan_account_number, sanctioned_amount, status || 'active']
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Get loans by booking
    getByBookingId: async (bookingId) => {
        try {
            return await getAll('SELECT * FROM customer_loans WHERE booking_id = ?', [bookingId]);
        } catch (error) {
            throw error;
        }
    },

    // Update disbursed amount (when payment received from bank)
    recordDisbursement: async (loanId, amount) => {
        try {
            // We just track it here. The actual Money IN is recorded in `payments` table.
            const loan = await getOne('SELECT * FROM customer_loans WHERE id = ?', [loanId]);
            const newDisbursed = loan.disbursed_amount + amount;

            await runQuery('UPDATE customer_loans SET disbursed_amount = ? WHERE id = ?', [newDisbursed, loanId]);
            return true;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = CustomerLoan;
