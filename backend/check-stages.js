const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/erp.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the ERP database.');
});

db.all("SELECT * FROM construction_stages", [], (err, rows) => {
    if (err) {
        console.error('Error selecting stages:', err);
    } else {
        console.log('Stages:', rows);
    }
    db.close();
});
