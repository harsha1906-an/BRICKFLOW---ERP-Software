require('dotenv').config();
const mongoose = require('mongoose');

// Connect to DB
mongoose.connect(process.env.DATABASE || "mongodb://localhost:27017/brickflow_erp")
    .then(() => console.log('Connected to DB'))
    .catch(err => console.error('DB Connection Error:', err));

async function fixVillaCompanyIds() {
    try {
        const Villa = require('./src/models/appModels/Villa');

        const targetCompanyId = '697db55a9c08d2a13efd9910';

        console.log('\n=== FIXING VILLA COMPANY IDS ===\n');

        // Find all villas without a companyId
        const villasWithoutCompany = await Villa.find({
            $or: [
                { companyId: null },
                { companyId: { $exists: false } }
            ]
        });

        console.log(`Found ${villasWithoutCompany.length} villas without companyId`);

        if (villasWithoutCompany.length > 0) {
            console.log(`\nUpdating ${villasWithoutCompany.length} villas to companyId: ${targetCompanyId}...\n`);

            const result = await Villa.updateMany(
                {
                    $or: [
                        { companyId: null },
                        { companyId: { $exists: false } }
                    ]
                },
                {
                    $set: { companyId: targetCompanyId }
                }
            );

            console.log('✅ Update complete!');
            console.log('Modified count:', result.modifiedCount);
            console.log('Matched count:', result.matchedCount);

            // Verify
            const verifyCount = await Villa.countDocuments({ companyId: targetCompanyId });
            console.log(`\nVerification: ${verifyCount} villas now have companyId ${targetCompanyId}`);

            // Show sample
            const sampleVillas = await Villa.find({ companyId: targetCompanyId, removed: false }).limit(3);
            console.log('\nSample non-removed villas:');
            sampleVillas.forEach(v => {
                console.log(`  - Villa ${v.villaNumber}, companyId: ${v.companyId}`);
            });
        } else {
            console.log('No villas need updating');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Give it a moment to connect then run
setTimeout(fixVillaCompanyIds, 1000);
