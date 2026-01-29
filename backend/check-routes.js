const fs = require('fs');
const files = [
    'health.routes', 'auth.routes', 'project.routes', 'unit.routes',
    'supplier.routes', 'material.routes', 'inventory.routes', 'purchase.routes',
    'expense.routes', 'customer.routes', 'booking.routes', 'payment.routes',
    'reports.routes', 'labour.routes', 'purchaseOrder.routes', 'approval.routes',
    'finance.routes', 'audit.routes', 'paymentRequest.routes', 'pettyCash.routes',
    'notification.routes'
];

const middlewares = [
    { name: 'errorHandler', path: './src/middleware/errorHandler', prop: 'errorHandler' },
    { name: 'notFoundHandler', path: './src/middleware/errorHandler', prop: 'notFoundHandler' },
    { name: 'logger', path: './src/middleware/logger', prop: 'default' },
    { name: 'xss', path: './src/middleware/xss', prop: 'default' }
];

const logFile = 'route-check-final.log';
fs.writeFileSync(logFile, 'START CHECK\n');

files.forEach(f => {
    try {
        fs.appendFileSync(logFile, `Loading route ${f}...\n`);
        const mod = require(`./src/routes/${f}`);
        fs.appendFileSync(logFile, `${f}: ${typeof mod}\n`);
    } catch (e) {
        fs.appendFileSync(logFile, `❌ CRASH loading route ${f}: ${e.message}\n`);
    }
});

middlewares.forEach(m => {
    try {
        fs.appendFileSync(logFile, `Loading middleware ${m.name}...\n`);
        const mod = require(m.path);

        let val;
        if (m.prop === 'default') val = mod;
        else val = mod[m.prop];

        fs.appendFileSync(logFile, `${m.name}: ${typeof val}\n`);

    } catch (e) {
        fs.appendFileSync(logFile, `❌ CRASH loading middleware ${m.name}: ${e.message}\n`);
    }
});

fs.appendFileSync(logFile, 'END CHECK\n');
