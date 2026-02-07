
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE);

async function run() {
    try {
        console.log('Connected to DB');

        // Load Model
        require('../src/models/appModels/InventoryTransaction');
        const InventoryTransaction = mongoose.model('InventoryTransaction');

        // Update all documents to have removed: false where it is missing
        const result = await InventoryTransaction.updateMany(
            { removed: { $exists: false } },
            { $set: { removed: false } }
        );

        console.log(`Updated ${result.modifiedCount} InventoryTransactions.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
}

run();
