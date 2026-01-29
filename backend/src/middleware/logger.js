const logger = (req, res, next) => {
    const start = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const log = `${timestamp} | ${req.method} ${req.path} | ${res.statusCode} | ${duration}ms`;

        // Color code based on status
        if (res.statusCode >= 500) {
            console.error('❌', log);
        } else if (res.statusCode >= 400) {
            console.warn('⚠️ ', log);
        } else {
            console.log('✅', log);
        }
    });

    next();
};

module.exports = logger;
