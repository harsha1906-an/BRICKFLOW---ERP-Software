require('dotenv').config();
const mongoose = require('mongoose');

// Connect to DB
mongoose.connect(process.env.DATABASE || "mongodb://localhost:27017/brickflow_erp")
    .then(() => console.log('Connected to DB'))
    .catch(err => console.error('DB Connection Error:', err));

async function checkVillas() {
    try {
        const Villa = require('./src/models/appModels/Villa');

        console.log('\n=== CHECKING VILLAS IN DATABASE ===\n');

        const targetCompanyId = '697db55a9c08d2a13efd9910';

        // Get all villas (ignoring removed)
        const allVillas = await Villa.find({}).limit(10);
        const totalCount = await Villa.countDocuments({});
        const nonRemovedCount = await Villa.countDocuments({ removed: false });
        const withTargetCompany = await Villa.countDocuments({ companyId: targetCompanyId });

        console.log('Total villas in database:', totalCount);
        console.log('Non-removed villas:', nonRemovedCount);
        console.log(`Villas with companyId ${targetCompanyId}:`, withTargetCompany);

        if (allVillas.length > 0) {
            console.log('\n=== First 10 villas in database: ===');
            allVillas.forEach((villa, index) => {
                console.log(`\n${index + 1}. Villa ${villa.villaNumber || 'N/A'}`);
                console.log('   _id:', villa._id);
                console.log('   companyId:', villa.companyId || 'NULL/UNDEFINED');
                console.log('   removed:', villa.removed);
                console.log('   name:', villa.name || 'N/A');
                console.log('   projectId:', villa.projectId || 'NULL');
            });

            // Check unique companyIds
            const uniqueCompanyIds = await Villa.distinct('companyId');
            console.log('\n=== Unique companyIds in villas: ===');
            uniqueCompanyIds.forEach(id => {
                console.log('  -', id);
            });
        } else {
            console.log('\n❌ No villas found in database!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Give it a moment to connect then run
setTimeout(checkVillas, 1000);
