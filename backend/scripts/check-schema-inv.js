const { runQuery, getAll } = require('../src/config/db');

async function checkSchema() {
    try {
        console.log('Checking inventory_transactions columns...');
        const result = await getAll("PRAGMA table_info(inventory_transactions)");
        console.table(result);

        const hasUsageReason = result.some(col => col.name === 'usage_reason');
        console.log('Has usage_reason:', hasUsageReason);

    } catch (e) {
        console.error(e);
    }
}

checkSchema();
