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
        type: String, // e.g. "Villa 101"
        required: true,
    },
    location: {
        type: String,
    },
    state: {
        type: String, // Project State for POS
    },
    gstin: {
        type: String, // Project-specific GSTIN if applicable
    },
    status: {
        type: String,
        default: 'Planning',
        enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
    },
    budget: {
        type: Number,
        default: 0,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    manager: {
        type: mongoose.Schema.ObjectId,
        ref: 'Admin', // Engineer or Manager
        autopopulate: true,
    },
    client: {
        type: mongoose.Schema.ObjectId,
        ref: 'Client', // Customer owner of the villa
        autopopulate: true,
    },
    description: {
        type: String,
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

schema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Project', schema);
