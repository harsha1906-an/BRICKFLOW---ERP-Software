const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, '../../database/erp.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Initialize database with schema
const initDatabase = () => {
    const initSqlPath = path.join(__dirname, '../../database/init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    db.exec(initSql, (err) => {
        if (err) {
            console.error('Error initializing database:', err.message);
            console.warn('⚠️  Server continuing despite DB init errors - some features may not work');
            // Don't throw - allow server to start
        } else {
            console.log('Database initialized successfully');
        }
    });
};

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

// Helper function to get single row
const getOne = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Helper function to get multiple rows
const getAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Helper function to run queries in a transaction
const runTransaction = async (callback) => {
    return new Promise(async (resolve, reject) => {
        db.serialize(async () => {
            try {
                await runQuery('BEGIN TRANSACTION');
                const result = await callback();
                await runQuery('COMMIT');
                resolve(result);
            } catch (error) {
                await runQuery('ROLLBACK');
                reject(error);
            }
        });
    });
};

module.exports = {
    db,
    initDatabase,
    runQuery,
    getOne,
    getAll,
    runTransaction,
    // Legacy alias for compatibility
    run: runQuery
};
