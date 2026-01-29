// Validation middleware

const validateRequired = (fields) => {
    return (req, res, next) => {
        const missing = fields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || value === '';
        });

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missing.join(', ')}`
            });
        }
        next();
    };
};

const validateNumber = (field, min = 0) => {
    return (req, res, next) => {
        const value = parseFloat(req.body[field]);

        if (isNaN(value)) {
            return res.status(400).json({
                success: false,
                message: `${field} must be a valid number`
            });
        }

        if (value < min) {
            return res.status(400).json({
                success: false,
                message: `${field} must be >= ${min}`
            });
        }

        req.body[field] = value;
        next();
    };
};

const validatePositiveNumber = (field) => {
    return validateNumber(field, 0.01);
};

const validateDate = (field) => {
    return (req, res, next) => {
        const value = req.body[field];

        if (!value) {
            return res.status(400).json({
                success: false,
                message: `${field} is required`
            });
        }

        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return res.status(400).json({
                success: false,
                message: `${field} must be a valid date`
            });
        }

        next();
    };
};

module.exports = {
    validateRequired,
    validateNumber,
    validatePositiveNumber,
    validateDate
};
