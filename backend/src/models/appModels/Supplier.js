const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    removed: {
        type: Boolean,
        default: false,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    name: {
        type: String,
        required: true,
    },
    supplierType: {
        type: String,
        enum: [
            'cement',
            'aggregate',
            'steel',
            'rods',
            'bricks',
            'tiles',
            'electrical',
            'plumbing',
            'hardware',
            'paint',
            'wood',
            'glass',
            'sanitary',
            'other'
        ],
        default: 'other'
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || /^[0-9]{10}$/.test(v);
            },
            message: (props) => `${props.value} is not a valid 10-digit phone number!`,
        },
    },
    address: {
        type: String,
    },
    city: {
        type: String,
    },
    country: {
        type: String,
    },
    website: {
        type: String,
    },
    taxNumber: {
        type: String, // GST or VAT Number
    },
    creditPeriod: {
        type: Number, // In days
        default: 0,
    },
    created: {
        type: Date,
        default: Date.now,
    },
    updated: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Supplier', schema);
