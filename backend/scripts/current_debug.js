
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE);

async function run() {
    try {
        console.log('Connected to DB');

        // Load ALL Models to prevent autopopulate errors
        const models = ['Supplier', 'InventoryTransaction', 'Material', 'Project', 'Villa', 'Admin', 'Client'];
        for (const m of models) {
            try {
                require(`../src/models/appModels/${m}`);
            } catch (e) {
                console.log(`Skipping ${m}: ${e.message}`);
            }
        }

        const Supplier = mongoose.model('Supplier');
        const InventoryTransaction = mongoose.model('InventoryTransaction');

        // 1. Find the Supplier "HARSHA BLUE METALS"
        const suppliers = await Supplier.find({ name: /HARSHA/i });
        console.log(`Found ${suppliers.length} suppliers matching "HARSHA"`);

        if (suppliers.length === 0) { console.log("No supplier found."); return; }

        const targetSupplier = suppliers.find(s => s.name.includes('BLUE METALS')) || suppliers[0];
        console.log(`Target: ${targetSupplier.name} (${targetSupplier._id})`);

        // 2. Check Inventory Transactions
        const transactions = await InventoryTransaction.find({ supplier: targetSupplier._id });
        console.log(`Transactions found: ${transactions.length}`);

        if (transactions.length > 0) {
            transactions.forEach((t, i) => {
                console.log(`[${i}] Type: ${t.type}, Cost: ${t.totalCost}, Date: ${t.date}`);
            });
        } else {
            console.log("No transactions found for this supplier ID.");

            // Check finding by name just in case of weird link? No, id is safer.
            // Check ALL transactions
            const count = await InventoryTransaction.countDocuments();
            console.log(`Total Inventory Transactions in DB: ${count}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
}

run();
