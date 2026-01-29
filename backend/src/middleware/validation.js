const Joi = require('joi');

// Common validation schemas
const schemas = {
    // Payment validation
    payment: Joi.object({
        booking_id: Joi.number().integer().positive().required(),
        payment_date: Joi.date().iso().required(),
        amount: Joi.number().precision(2).required(),
        payment_method: Joi.alternatives().try(
            Joi.number().integer().positive(), // New ID approach
            Joi.string().valid('cash', 'bank', 'cheque', 'online', 'loan', 'upi', 'neft', 'rtgs') // Legacy string approach
        ).required(),
        reference_number: Joi.string().max(100).allow('', null),
        notes: Joi.string().max(500).allow('', null),
        has_gst: Joi.boolean().default(false),
        gst_percentage: Joi.number().valid(0, 5, 12, 18, 28).default(0),
        accounting_type: Joi.string().valid('ACCOUNTABLE', 'NON_ACCOUNTABLE').required(),
        allow_overpayment: Joi.boolean().default(false)
    }),

    // Purchase validation
    purchase: Joi.object({
        supplier_id: Joi.number().integer().positive().required(),
        project_id: Joi.number().integer().positive().required(),
        purchase_date: Joi.date().iso().required(),
        amount: Joi.number().positive().precision(2).required(),
        description: Joi.string().max(500).required(),
        invoice_number: Joi.string().max(100).allow('', null),
        payment_status: Joi.string().valid('pending', 'paid', 'partial').default('pending'),
        has_gst: Joi.boolean().default(false),
        gst_percentage: Joi.number().valid(0, 5, 12, 18, 28).default(0),
        is_accountable: Joi.boolean().default(true)
    }),

    // Booking validation
    booking: Joi.object({
        customer_id: Joi.number().integer().positive().required(),
        unit_id: Joi.number().integer().positive().required(),
        booking_date: Joi.date().iso().required(),
        total_amount: Joi.number().positive().precision(2).required(),
        advance_amount: Joi.number().positive().precision(2).required(),
        booking_status: Joi.string().valid('active', 'cancelled', 'completed').default('active')
    }),

    // Inventory transaction validation
    inventoryTransaction: Joi.object({
        material_id: Joi.number().integer().positive().required(),
        project_id: Joi.number().integer().positive().required(),
        transaction_date: Joi.date().iso().required(),
        type: Joi.string().valid('IN', 'OUT').required(),
        quantity: Joi.number().positive().required(),
        unit_price: Joi.number().positive().precision(2).allow(null),
        purpose: Joi.string().max(200).when('type', {
            is: 'OUT',
            then: Joi.required(),
            otherwise: Joi.allow('', null)
        })
    }),

    // Petty cash transaction validation
    pettyCashTransaction: Joi.object({
        project_id: Joi.number().integer().positive().required(),
        transaction_date: Joi.date().iso().required(),
        type: Joi.string().valid('disbursement', 'receipt', 'replenishment').required(),
        amount: Joi.number().positive().precision(2).required(),
        category: Joi.string().valid('transport', 'food', 'materials', 'utilities', 'misc').when('type', {
            is: 'disbursement',
            then: Joi.required(),
            otherwise: Joi.allow(null)
        }),
        description: Joi.string().max(500).required(),
        receipt_number: Joi.string().max(100).allow('', null),
        has_gst: Joi.boolean().default(false),
        gst_percentage: Joi.number().valid(0, 5, 12, 18, 28).default(0),
        is_accountable: Joi.boolean().default(true)
    }),

    // User registration/update validation
    user: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        username: Joi.string().alphanum().min(3).max(50).required(),
        password: Joi.string().min(8).max(100).pattern(
            new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')
        ).required().messages({
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }),
        role: Joi.string().valid('admin', 'manager', 'supervisor', 'staff', 'owner', 'accounts').required()
    }),

    // Login validation
    login: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    }),

    // ID parameter validation
    id: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Replace request data with validated and sanitized data
        req[property] = value;
        next();
    };
};

module.exports = {
    schemas,
    validate
};
