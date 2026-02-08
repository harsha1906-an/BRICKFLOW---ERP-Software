require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {
    console.log('Connected to MongoDB');

    try {
        // List of core models to preserve (Admin, Settings)
        // These are usually in coreModels, so we don't need to list them unless we iterate all collections.
        // But to be safe, we will list only App Models to wipe.

        // Load all App Models
        require('./src/models/appModels/Attendance');
        require('./src/models/appModels/Booking');
        require('./src/models/appModels/Client');
        // require('./src/models/appModels/Company'); // Company might be needed? Usually yes for SaaS, but this looks like single tenant. Let's wipe.
        require('./src/models/appModels/Expense');
        require('./src/models/appModels/GoodsReceipt');
        require('./src/models/appModels/InventoryTransaction');
        require('./src/models/appModels/Invoice');
        require('./src/models/appModels/InvoiceUpdate'); // History
        require('./src/models/appModels/Labour');
        require('./src/models/appModels/LabourContract');
        require('./src/models/appModels/Lead');
        require('./src/models/appModels/Material');
        require('./src/models/appModels/Payment');
        // require('./src/models/appModels/PaymentMode'); // PRESERVE
        require('./src/models/appModels/PaymentUpdate'); // History
        require('./src/models/appModels/PettyCashTransaction');
        require('./src/models/appModels/Project');
        require('./src/models/appModels/PurchaseOrder');
        require('./src/models/appModels/Quote');
        require('./src/models/appModels/Supplier');
        // require('./src/models/appModels/Taxes'); // PRESERVE
        require('./src/models/appModels/Villa');
        require('./src/models/appModels/VillaStock');

        const modelsToWipe = [
            'Attendance',
            'Booking',
            'Client',
            'Company',
            'Expense',
            'GoodsReceipt',
            'InventoryTransaction',
            'Invoice',
            'InvoiceUpdate',
            'Labour',
            'LabourContract',
            'Lead',
            'Material',
            'Payment',
            // 'PaymentMode', // PRESERVE
            'PaymentUpdate',
            'PettyCashTransaction',
            'Project',
            'PurchaseOrder',
            'Quote',
            'Supplier',
            // 'Taxes', // PRESERVE
            'Villa',
            'VillaStock'
        ];

        console.log('Starting data wipe...');

        for (const modelName of modelsToWipe) {
            try {
                const Model = mongoose.model(modelName);
                if (Model) { // Check if model exists
                    const result = await Model.deleteMany({});
                    console.log(`Wiped ${modelName}: ${result.deletedCount} documents deleted`);
                }
            } catch (e) {
                if (e.name === 'MissingSchemaError') {
                    console.warn(`Model ${modelName} not registered, skipping.`);
                } else {
                    console.error(`Error wiping ${modelName}:`, e);
                }
            }
        }

        console.log('Data wipe completed successfully.');

    } catch (error) {
        console.error('Error during data wipe:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
});
