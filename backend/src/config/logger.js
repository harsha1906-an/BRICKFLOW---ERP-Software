const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'erp-backend' },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined logs
        new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Auth logs (separate for security)
        new winston.transports.File({
            filename: path.join('logs', 'auth.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 10,
        })
    ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
    }));
}

// Create specific loggers for different contexts
logger.auth = (message, meta = {}) => {
    logger.info(message, { ...meta, context: 'auth' });
};

logger.database = (message, meta = {}) => {
    logger.info(message, { ...meta, context: 'database' });
};

logger.api = (message, meta = {}) => {
    logger.info(message, { ...meta, context: 'api' });
};

logger.security = (message, meta = {}) => {
    logger.warn(message, { ...meta, context: 'security' });
};

module.exports = logger;
