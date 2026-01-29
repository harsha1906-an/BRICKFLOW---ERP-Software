const { runQuery, getAll } = require('../src/config/db');

async function migrateAttendance() {
    try {
        console.log('Migrating labour_attendance schema...');

        const cols = await getAll(`PRAGMA table_info(labour_attendance)`);
        const colNames = cols.map(c => c.name);

        if (!colNames.includes('attendance_type')) {
            console.log('Adding attendance_type...');
            await runQuery(`ALTER TABLE labour_attendance ADD COLUMN attendance_type TEXT DEFAULT 'FULL'`);
        }

        if (!colNames.includes('marked_by')) {
            console.log('Adding marked_by...');
            await runQuery(`ALTER TABLE labour_attendance ADD COLUMN marked_by INTEGER`);
        }

        if (!colNames.includes('labour_payment_id')) {
            console.log('Adding labour_payment_id...');
            await runQuery(`ALTER TABLE labour_attendance ADD COLUMN labour_payment_id INTEGER`);
        }

        // Ensure status defaults to 'draft' if not set (SQLite ALTER COLUMN DEFAULT is hard, so we just rely on code or constraint if possible. 
        // But for existing rows, we might want to update NULLs? existing rows status might be 'present'/'absent' if used as type.
        // Let's check existing usage of status first.)
        const statusCheck = await getAll('SELECT DISTINCT status FROM labour_attendance');
        console.log('Current status values:', statusCheck);

        // If status values are 'present', 'absent', we should migrate them to 'attendance_type' and set status to 'confirmed' (assuming historical data is final).
        for (const row of statusCheck) {
            const s = row.status;
            if (s === 'present' || s === 'absent' || s === 'half_day') {
                console.log(`Migrating legacy status '${s}' to attendance_type...`);
                // Map legacy status to new type
                let type = 'FULL';
                if (s === 'absent') type = 'ABSENT';
                if (s === 'half_day') type = 'HALF';

                // Update type and set status to confirmed (historical)
                await runQuery(
                    `UPDATE labour_attendance SET attendance_type = ?, status = 'confirmed' WHERE status = ?`,
                    [type, s]
                );
            }
        }

        console.log('Migration complete.');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrateAttendance();
