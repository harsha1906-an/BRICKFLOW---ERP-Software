const { getAll, runQuery, getOne } = require('../config/db');

const PaymentSchedule = {
    // Get schedule for a booking
    getByBookingId: async (bookingId) => {
        try {
            return await getAll('SELECT * FROM payment_schedules WHERE booking_id = ? ORDER BY due_date ASC', [bookingId]);
        } catch (error) {
            throw error;
        }
    },

    // Generates Monthly EMIs
    generateEMI: async (bookingId, totalAmount, months, startDate, interestRate = 0) => {
        try {
            // Simple EMI calculation (Flat or Reducing? Using Flat for simplicity or just principal division if 0 interest)
            // If 0 interest, Simple Division.
            // Formula: P * r * (1+r)^n / ((1+r)^n - 1) for Reducing.

            let emiAmount;
            if (interestRate === 0) {
                emiAmount = totalAmount / months;
            } else {
                const r = interestRate / 12 / 100;
                emiAmount = totalAmount * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
            }

            const start = new Date(startDate);

            for (let i = 0; i < months; i++) {
                const dueDate = new Date(start);
                dueDate.setMonth(start.getMonth() + i);

                await runQuery(
                    `INSERT INTO payment_schedules (booking_id, due_date, amount, description, status) 
                     VALUES (?, ?, ?, ?, 'pending')`,
                    [bookingId, dueDate.toISOString().split('T')[0], emiAmount.toFixed(2), `EMI #${i + 1}`]
                );
            }
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Record Payment against a schedule item
    recordPayment: async (scheduleId, amount) => {
        try {
            // Check current status
            const item = await getOne('SELECT * FROM payment_schedules WHERE id = ?', [scheduleId]);
            if (!item) throw new Error('Schedule item not found');

            const newPaid = item.paid_amount + amount;
            let status = 'partially_paid';
            if (newPaid >= item.amount - 0.1) status = 'paid'; // Tolerance for float

            await runQuery(
                `UPDATE payment_schedules SET paid_amount = ?, status = ? WHERE id = ?`,
                [newPaid, status, scheduleId]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = PaymentSchedule;
