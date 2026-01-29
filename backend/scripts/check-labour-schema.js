const { getAll } = require('../src/config/db');

async function checkLabourSchema() {
    try {
        const fs = require('fs');
        const sql = await getAll("SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('labours', 'labour_attendance')");
        fs.writeFileSync('schema_dump.txt', JSON.stringify(sql, null, 2));
        console.log('Schema dumped to schema_dump.txt');
    } catch (e) {
        console.error(e);
    }
}
checkLabourSchema();
