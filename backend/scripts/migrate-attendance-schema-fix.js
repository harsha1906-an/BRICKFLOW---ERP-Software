const { runQuery, getAll } = require('../src/config/db');
const fs = require('fs');

async function fixAttendanceSchema() {
    try {
        console.log('Starting Schema Fix for labour_attendance (New Strategy)...');

        // 1. Create NEW table
        console.log('Creating labour_attendance_new...');
        await runQuery("DROP TABLE IF EXISTS labour_attendance_new");
        await runQuery(`
            CREATE TABLE labour_attendance_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                labour_id INTEGER NOT NULL,
                project_id INTEGER NOT NULL,
                attendance_date DATE NOT NULL,
                status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'confirmed')), 
                attendance_type TEXT DEFAULT 'FULL' CHECK(attendance_type IN ('FULL', 'HALF', 'HOURLY', 'ABSENT')),
                work_hours REAL DEFAULT 8,
                overtime_hours REAL DEFAULT 0,
                time_in TIME,
                time_out TIME,
                notes TEXT,
                substitute_labour_id INTEGER,
                marked_by INTEGER,
                labour_payment_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (labour_id) REFERENCES labours(id),
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (substitute_labour_id) REFERENCES labours(id),
                UNIQUE(labour_id, attendance_date)
            )
        `);

        // 2. Copy Data from CURRENT table
        console.log('Copying data from labour_attendance...');
        const oldCols = await getAll("PRAGMA table_info(labour_attendance)");
        const hasAttendanceType = oldCols.some(c => c.name === 'attendance_type');

        if (hasAttendanceType) {
            console.log('Copying data (v2 schema detected)...');
            await runQuery(`
                INSERT INTO labour_attendance_new (
                    id, labour_id, project_id, attendance_date, status, 
                    attendance_type, work_hours, overtime_hours, time_in, time_out, 
                    notes, substitute_labour_id, marked_by, labour_payment_id, created_at
                )
                SELECT 
                    id, labour_id, project_id, attendance_date, 
                    CASE WHEN status IN ('present', 'absent', 'half_day', 'leave') THEN 'confirmed' ELSE status END,
                    attendance_type, work_hours, overtime_hours, time_in, time_out,
                    notes, substitute_labour_id, marked_by, labour_payment_id, created_at
                FROM labour_attendance
             `);
        } else {
            console.log('Copying data (v1 schema detected)...');
            await runQuery(`
                INSERT INTO labour_attendance_new (
                    id, labour_id, project_id, attendance_date, status, 
                    attendance_type, work_hours, overtime_hours, time_in, time_out, 
                    notes, substitute_labour_id, created_at
                )
                SELECT 
                    id, labour_id, project_id, attendance_date, 'confirmed',
                    CASE 
                        WHEN status = 'absent' THEN 'ABSENT'
                        WHEN status = 'half_day' THEN 'HALF'
                        ELSE 'FULL'
                    END,
                    work_hours, overtime_hours, time_in, time_out,
                    notes, substitute_labour_id, created_at
                FROM labour_attendance
             `);
        }

        // 3. Drop Old and Rename New
        console.log('Swapping tables...');
        await runQuery("DROP TABLE labour_attendance");
        await runQuery("ALTER TABLE labour_attendance_new RENAME TO labour_attendance");

        console.log('Schema Fix Complete.');

    } catch (e) {
        console.error('Migration Failed:', e);
        fs.writeFileSync('migration_err.txt', e.toString());
    }
}

fixAttendanceSchema();
