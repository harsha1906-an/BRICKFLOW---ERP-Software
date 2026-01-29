const cron = require('node-cron');
const { sendEmail } = require('./emailService');
const { getOne } = require('../config/db');

const startDailyJob = () => {
    // Schedule task to run at 8:00 PM every day
    cron.schedule('0 20 * * *', async () => {
        console.log('Running daily expense summary job...');
        try {
            // 1. Calculate today's total expenses
            const today = new Date().toISOString().split('T')[0];

            const sql = `
        SELECT 
          SUM(amount) as totalAmount,
          COUNT(*) as transactionCount
        FROM expenses 
        WHERE date(date) = ?
      `;

            const row = await getOne(sql, [today]);

            const totalAmount = row ? row.totalAmount || 0 : 0;
            const transactionCount = row ? row.transactionCount || 0 : 0;

            // 2. Draft email content
            const subject = `Daily Expense Summary - ${today}`;
            const text = `
        Daily Expense Summary for ${today}
        
        Total Expenses: ₹${totalAmount}
        Transaction Count: ${transactionCount}
        
        Please check the dashboard for more details.
      `;
            const html = `
        <h2>Daily Expense Summary for ${today}</h2>
        <p><strong>Total Expenses:</strong> ₹${totalAmount}</p>
        <p><strong>Transaction Count:</strong> ${transactionCount}</p>
        <p>Please check the <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">dashboard</a> for more details.</p>
      `;

            // 3. Send email to admin
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
            await sendEmail(adminEmail, subject, text, html);

        } catch (error) {
            console.error('Error in daily expense summary job:', error);
        }
    });

    console.log('Daily expense summary job scheduled for 8:00 PM');
};

module.exports = {
    startDailyJob,
};
