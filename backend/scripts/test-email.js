require('dotenv').config();
const { sendEmail } = require('../src/services/emailService');
const { initDatabase, getOne } = require('../src/config/db');

// Initialize DB to test query as well
initDatabase();

const testDailyJob = async () => {
    console.log('Running manual test of expense summary job...');
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

        // Wait a bit for DB to init
        setTimeout(async () => {
            const row = await getOne(sql, [today]);

            const totalAmount = row ? row.totalAmount || 0 : 0;
            const transactionCount = row ? row.transactionCount || 0 : 0;

            console.log(`Found expenses: Amount=${totalAmount}, Count=${transactionCount}`);

            // 2. Draft email content
            const subject = `TEST: Daily Expense Summary - ${today}`;
            const text = `
          Daily Expense Summary for ${today}
          
          Total Expenses: ₹${totalAmount}
          Transaction Count: ${transactionCount}
        `;
            const html = `
          <h2>Daily Expense Summary for ${today}</h2>
          <p><strong>Total Expenses:</strong> ₹${totalAmount}</p>
          <p><strong>Transaction Count:</strong> ${transactionCount}</p>
        `;

            // 3. Send email to admin
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
            console.log(`Sending email to ${adminEmail}...`);
            const info = await sendEmail(adminEmail, subject, text, html);

            if (info) {
                console.log('Email sent successfully:', info.messageId);
            } else {
                console.log('Email sending failed (likely due to missing credentials, which is expected in dev if env not set).');
            }
        }, 1000);

    } catch (error) {
        console.error('Error in daily expense summary job:', error);
    }
};

testDailyJob();
