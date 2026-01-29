const { getOne } = require('../src/config/db');

console.log('Testing DB connection...');
setTimeout(async () => {
    try {
        const sql = "SELECT 1 as val";
        const row = await getOne(sql);
        console.log('DB Success:', row);
    } catch (e) {
        console.error('DB Error:', e);
    }
}, 1000);
