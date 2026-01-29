const { getAll, run } = require('../config/db');

const GST_RATES = [0, 5, 12, 18, 28]; // Valid GST percentages

/**
 * Calculate GST amount and total
 */
const calculateGST = (baseAmount, gstPercentage) => {
    if (!gstPercentage || gstPercentage === 0) {
        return {
            base_amount: baseAmount,
            gst_amount: 0,
            total_amount: baseAmount
        };
    }

    const gstAmount = (baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    return {
        base_amount: parseFloat(baseAmount.toFixed(2)),
        gst_amount: parseFloat(gstAmount.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2))
    };
};

/**
 * CRITICALFIX #6: Calculate base amount and GST from total (reverse calculation)
 * Use when user knows the TOTAL amount including GST
 */
const calculateGSTFromTotal = (totalAmount, gstPercentage) => {
    if (!gstPercentage || gstPercentage === 0) {
        return {
            base_amount: totalAmount,
            gst_amount: 0,
            total_amount: totalAmount
        };
    }

    // Formula: Base = Total / (1 + GST%/100)
    const baseAmount = totalAmount / (1 + (gstPercentage / 100));
    const gstAmount = totalAmount - baseAmount;

    return {
        base_amount: parseFloat(baseAmount.toFixed(2)),
        gst_amount: parseFloat(gstAmount.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2))
    };
};


/**
 * Validate GST percentage
 */
const validateGSTPercentage = (percentage) => {
    return GST_RATES.includes(parseFloat(percentage));
};

/**
 * Helper to add accountable/GST fields to query results
 */
const enrichWithAccountableInfo = (records) => {
    if (!Array.isArray(records)) {
        records = [records];
    }

    return records.map(record => ({
        ...record,
        is_accountable: record.is_accountable === 1,
        has_gst: record.has_gst === 1,
        accountable_type: record.is_accountable === 1 ? 'accountable' : 'non-accountable'
    }));
};

module.exports = {
    calculateGST,
    calculateGSTFromTotal,
    validateGSTPercentage,
    enrichWithAccountableInfo,
    GST_RATES
};

