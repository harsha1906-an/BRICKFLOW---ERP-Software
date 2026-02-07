require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Connect to DB
mongoose.connect(process.env.DATABASE_CONNECTION).then(() => {
    console.log('Connected to DB');
    checkExpenses();
}).catch(err => {
    console.error('DB Connection Error:', err);
});

async function checkExpenses() {
    try {
        const expenseCollection = mongoose.connection.collection('expenses');

        const allExpenses = await expenseCollection.find({}).toArray();
        console.log(`Total Expenses: ${allExpenses.length}`);

        const labourExpenses = allExpenses.filter(e => e.recipientType === 'Labour');
        console.log(`Labour Expenses: ${labourExpenses.length}`);

        if (labourExpenses.length > 0) {
            console.log('Sample Labour Expense:', JSON.stringify(labourExpenses[0], null, 2));
        } else {
            console.log('No labour expenses found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
}
