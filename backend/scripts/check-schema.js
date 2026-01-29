const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/erp.db');

const db = new sqlite3.Database(dbPath);

console.log('🚀 Checking Payments Schema...');

db.all(`PRAGMA table_info(payments)`, (err, cols) => {
    if (err) {
        console.error('❌ Failed to get info:', err.message);
        process.exit(1);
    }

    const columns = cols.map(c => c.name);
    console.log('Found Columns:', columns.join(', '));

    const hasAccountingType = columns.includes('accounting_type');
    const hasIsAccountable = columns.includes('is_accountable');
    const hasGstAmount = columns.includes('gst_amount');

    console.log(`\n1. accounting_type exists? ${hasAccountingType ? '✅ YES' : '❌ NO'}`);
    console.log(`2. is_accountable exists? ${!hasIsAccountable ? '✅ NO (Correct)' : '❌ YES (Should be deleted)'}`);
    console.log(`3. gst_amount exists? ${hasGstAmount ? '✅ YES' : '❌ NO'}`);

    // Check constraints if possible (sqlite doesn't show CHECK easily in pragma, but we can verify not null in logic)
    const accTypeCol = cols.find(c => c.name === 'accounting_type');
    if (accTypeCol) {
        console.log(`   - Not Null? ${accTypeCol.notnull ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Type: ${accTypeCol.type}`);
    }

    db.close();
});
