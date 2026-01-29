const { getAll } = require('../src/config/db');

async function listTables() {
    try {
        const tables = await getAll("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables:', tables.map(t => t.name).join(', '));
    } catch (e) {
        console.error(e);
    }
}
listTables();
