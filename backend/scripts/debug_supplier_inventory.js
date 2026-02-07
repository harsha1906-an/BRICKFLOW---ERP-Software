
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE);

async function run() {
    try {
        console.log('Connected to DB');

        // 1. Find the Supplier
        // We assume the model is defined in appModels
        require('../src/models/appModels/Supplier');
        const Supplier = mongoose.model('Supplier');

        // Search for "Harsha" (case insensitive)
        const suppliers = await Supplier.find({ name: /Harsha/i });
        console.log(`Found ${suppliers.length} suppliers matching "Harsha"`);

        if (suppliers.length === 0) {
            console.log("No supplier found. Exiting.");
            return;
        }

        const supplier = suppliers[0];
        console.log(`Using Supplier: ${supplier.name} (${supplier._id})`);

        // 2. Load InventoryTransaction Model
        require('../src/models/appModels/InventoryTransaction');
        const InventoryTransaction = mongoose.model('InventoryTransaction');

        // 3. Find All Transactions for this Supplier
        const transactions = await InventoryTransaction.find({ supplier: supplier._id });
        console.log(`Found ${transactions.length} inventory transactions for this supplier.`);

        if (transactions.length > 0) {
            console.log("Sample Transaction:", JSON.stringify(transactions[0], null, 2));

            // Check filtering manually
            const inward = transactions.filter(t => t.type === 'inward');
            const cost = inward.reduce((sum, t) => sum + (t.totalCost || 0), 0);
            console.log(`Total Inward Cost (Calculated): ${cost}`);
        } else {
            console.log("WARNING: Zero transactions found. This explains the 0.00 cost.");

            // Check if there are ANY transactions in the system at all
            const allTrans = await InventoryTransaction.countDocuments();
            console.log(`Total InventoryTransactions in entire DB: ${allTrans}`);

            if (allTrans > 0) {
                const sample = await InventoryTransaction.findOne();
                console.log("Sample of ANY transaction:", JSON.stringify(sample, null, 2));
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
}

run();
