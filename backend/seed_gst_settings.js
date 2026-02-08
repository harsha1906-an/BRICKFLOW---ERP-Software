require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {
    console.log('Connected to MongoDB');

    try {
        const Setting = require('./src/models/coreModels/Setting');

        const settingsToUpdate = [
            {
                settingCategory: 'construction_company_settings (private)',
                settingKey: 'construction_company_name',
                settingValue: 'BEST CONSTRUCTIONS',
                valueType: 'String',
                isPrivate: true,
                isCoreSetting: false
            },
            {
                settingCategory: 'construction_company_settings (private)',
                settingKey: 'construction_gstin',
                settingValue: 'TESTGSTINNUMBER',
                valueType: 'String',
                isPrivate: true,
                isCoreSetting: false
            },
            {
                settingCategory: 'construction_company_settings (private)',
                settingKey: 'construction_address',
                settingValue: 'Tamil Nadu, India',
                valueType: 'String',
                isPrivate: true,
                isCoreSetting: false
            },
            {
                settingCategory: 'company_settings',
                settingKey: 'company_state',
                settingValue: 'Tamil Nadu',
                valueType: 'String',
                isPrivate: false,
                isCoreSetting: true
            }
        ];

        for (const setting of settingsToUpdate) {
            await Setting.findOneAndUpdate(
                { settingKey: setting.settingKey },
                setting,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`Updated setting: ${setting.settingKey}`);
        }

        console.log('Settings updated successfully.');

    } catch (error) {
        console.error('Error updating settings:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
});
