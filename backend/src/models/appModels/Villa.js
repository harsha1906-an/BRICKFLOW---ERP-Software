const mongoose = require('mongoose');

const villaSchema = new mongoose.Schema({
    removed: {
        type: Boolean,
        default: false,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: false,
        index: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false,
    },
    villaNumber: {
        type: String,
        required: true,
    },
    houseType: {
        type: String,
    },
    landArea: {
        type: Number,
    },
    groundFloorArea: {
        type: Number,
    },
    firstFloorArea: {
        type: Number,
    },
    secondFloorArea: {
        type: Number,
    },
    builtUpArea: {
        type: Number,
    },
    facing: {
        type: String,
    },
    accountableAmount: {
        type: Number,
        default: 0,
    },
    nonAccountableAmount: {
        type: Number,
        default: 0,
    },
    totalAmount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        default: 'active',
    },
    isAccountable: {
        type: Boolean,
        default: true,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

villaSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Villa', villaSchema);
