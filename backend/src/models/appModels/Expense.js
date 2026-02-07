const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    removed: {
        type: Boolean,
        default: false,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true,
    },
    number: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
    recipientType: {
        type: String,
        enum: ['Supplier', 'Labour', 'Other'],
        default: 'Other',
        required: true,
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: function () {
            return this.recipientType === 'Supplier';
        },
        autopopulate: true,
    },
    labour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
        required: function () {
            return this.recipientType === 'Labour';
        },
        autopopulate: true,
    },
    villa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Villa',
        autopopulate: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card'],
        default: 'Cash',
    },
    penalty: {
        type: Number,
        default: 0,
    },
    advance: {
        type: Number,
        default: 0,
    },
    reference: {
        type: String,
    },
    description: {
        type: String,
    },
    updated: {
        type: Date,
        default: Date.now,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

schema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Expense', schema);
