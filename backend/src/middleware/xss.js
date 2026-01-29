const xss = require('xss');

/**
 * Sanitize object recursively
 * @param {Object} data - Input data
 * @return {Object} Sanitized data
 */
const sanitize = (data) => {
    if (!data) return data;

    if (typeof data === 'string') {
        return xss(data);
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitize(item));
    }

    if (typeof data === 'object') {
        const sanitized = {};
        for (const key in data) {
            sanitized[key] = sanitize(data[key]);
        }
        return sanitized;
    }

    return data;
};

/**
 * Middleware to sanitize request data
 */
const xssSanitizer = (req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
};

module.exports = xssSanitizer;
