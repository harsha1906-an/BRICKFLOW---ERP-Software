const logger = require('../config/logger');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id
    });

    // Determine status code
    const statusCode = err.statusCode || 500;

    // Production vs Development error response
    const errorResponse = {
        success: false,
        message: err.message || 'Internal server error'
    };

    // Add additional details in development
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
        errorResponse.details = err.details;
    } else {
        // Sanitize error messages in production
        if (statusCode === 500) {
            errorResponse.message = 'An unexpected error occurred. Please try again later.';
        }
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
};

// Not found handler
const notFoundHandler = (req, res) => {
    logger.warn('404 Not Found', {
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    res.status(404).json({
        success: false,
        message: 'Resource not found'
    });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error classes
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
    }
}

class AuthorizationError extends Error {
    constructor(message = 'Access denied') {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = 403;
    }
}

class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class DatabaseError extends Error {
    constructor(message = 'Database operation failed') {
        super(message);
        this.name = 'DatabaseError';
        this.statusCode = 500;
    }
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    DatabaseError
};
