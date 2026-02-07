const mongoose = require('mongoose');
const Model = mongoose.model('PettyCashTransaction');

const summary = async (req, res) => {
    try {
        const response = await Model.aggregate([
            {
                $match: {
                    removed: false,
                },
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const { calculate } = require('@/helpers');

        let totalInward = 0;
        let totalOutward = 0;

        response.forEach((item) => {
            if (item._id === 'inward') totalInward = item.total;
            if (item._id === 'outward') totalOutward = item.total;
        });

        const balance = calculate.sub(totalInward, totalOutward);

        const finalResult = {
            totalInward,
            totalOutward,
            balance,
        };

        return res.status(200).json({
            success: true,
            result: finalResult,
            message: `Successfully calculated petty cash summary`,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            result: null,
            message: 'Error calculating summary',
            error: err.message,
        });
    }
};

module.exports = summary;
