require('module-alias/register');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '.env' });

async function testSummary() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.DATABASE);
        console.log('Connected!');

        // Load models
        const glob = require('glob');
        const modelsFiles = glob.globSync('./src/models/**/*.js');
        for (const filePath of modelsFiles) {
            require(path.resolve(filePath));
        }

        const { runDailySummary } = require('./src/controllers/appControllers/cronController');

        const targetEmail = process.argv[2];
        if (!targetEmail) {
            console.error('Usage: node test_email.js <your_resend_signup_email>');
            process.exit(1);
        }

        console.log(`Triggering daily summary email to ${targetEmail}...`);
        await runDailySummary(targetEmail);
        console.log('Task finished. Check your inbox!');

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testSummary();
