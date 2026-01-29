const logger = require('../config/logger');

/**
 * Validate required environment variables
 */
function validateEnvironment() {
    const required = ['JWT_SECRET'];
    const missing = [];

    required.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    if (missing.length > 0) {
        logger.error('Missing required environment variables', { missing });
        console.error('❌ Missing required environment variables:', missing.join(', '));
        console.error('Please check your .env file and ensure all required variables are set.');
        process.exit(1);
    }

    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        logger.warn('JWT_SECRET is too short', { length: process.env.JWT_SECRET.length });
        console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters for security');
    }

    // Check for production environment
    if (process.env.NODE_ENV === 'production') {
        if (process.env.CORS_ORIGIN === 'http://localhost:5173') {
            logger.warn('CORS_ORIGIN is set to localhost in production');
            console.warn('⚠️  WARNING: CORS_ORIGIN should not be localhost in production');
        }
    }

    logger.info('Environment validation passed');
    return true;
}

/**
 * Get environment configuration summary
 */
function getEnvInfo() {
    return {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        logLevel: process.env.LOG_LEVEL || 'info',
        jwtConfigured: !!process.env.JWT_SECRET
    };
}

module.exports = {
    validateEnvironment,
    getEnvInfo
};
