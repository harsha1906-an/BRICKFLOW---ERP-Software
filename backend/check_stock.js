
const mongoose = require('mongoose');
require('dotenv').config({ path: 'src/config/.env' }); // try standard path
require('dotenv').config({ path: '.env' }); // try root path

async function checkStock() {
    try {
        if (!process.env.DATABASE) {
            console.log("DATABASE env not found, trying hardcoded local");
            await mongoose.connect('mongodb://localhost:27017/erp');
        } else {
            await mongoose.connect(process.env.DATABASE);
        }
        console.log('Connected to MongoDB');

        const schema = new mongoose.Schema({
            villa: { type: mongoose.Schema.ObjectId, ref: 'Villa' },
            material: { type: mongoose.Schema.ObjectId, ref: 'Material' },
            currentStock: Number,
            removed: Boolean
        });

        // We need to define the model if it's not loaded, but since we are script, we define ad-hoc or load
        const VillaStock = mongoose.model('VillaStock', schema);

        const stocks = await VillaStock.find({});
        console.log(`Found ${stocks.length} VillaStock records:`);
        console.log(JSON.stringify(stocks, null, 2));

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkStock();
