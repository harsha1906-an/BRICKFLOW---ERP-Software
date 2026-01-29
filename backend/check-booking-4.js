const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/erp.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the ERP database.');
});

db.get("SELECT * FROM bookings WHERE id = 4", [], (err, row) => {
    if (err) {
        console.error('Error selecting booking:', err);
    } else {
        console.log(`Booking 4: unit_id=${row.unit_id}, status='${row.status}', customer_id=${row.customer_id}`);
    }
    db.close();
});
