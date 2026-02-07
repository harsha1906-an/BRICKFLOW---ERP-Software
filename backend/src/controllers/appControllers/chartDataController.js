const mongoose = require('mongoose');
const moment = require('moment');

const Payment = mongoose.model('Payment');
const PettyCashTransaction = mongoose.model('PettyCashTransaction');

const chartData = async (req, res) => {
    try {
        const months = 6;
        const today = moment();
        const startDate = today.clone().subtract(months - 1, 'months').startOf('month');
        const endDate = today.clone().endOf('month');

        // Helper function to generate aggregation pipeline
        const getAggregation = (Model, dateField, matchQuery = {}) => [
            {
                $match: {
                    removed: false,
                    [dateField]: {
                        $gte: startDate.toDate(),
                        $lte: endDate.toDate(),
                    },
                    ...matchQuery,
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } },
                    total: { $sum: '$amount' }, // Assuming 'amount' is the field name for both
                },
            },
        ];

        const [incomeResult, expenseResult] = await Promise.all([
            Payment.aggregate(getAggregation(Payment, 'date')),
            PettyCashTransaction.aggregate(getAggregation(PettyCashTransaction, 'date', { type: 'outward' })),
        ]);

        // Format results into a map for easy lookup
        const incomeMap = {};
        incomeResult.forEach((item) => {
            incomeMap[item._id] = item.total;
        });

        const expenseMap = {};
        expenseResult.forEach((item) => {
            expenseMap[item._id] = item.total;
        });

        // Generate last 6 months list
        const chartData = [];
        for (let i = 0; i < months; i++) {
            const date = startDate.clone().add(i, 'months');
            const key = date.format('YYYY-MM');
            chartData.push({
                name: date.format('MMM'),
                income: incomeMap[key] || 0,
                expense: expenseMap[key] || 0,
            });
        }

        return res.status(200).json({
            success: true,
            result: chartData,
            message: 'Successfully fetched chart data',
        });
    } catch (error) {
        console.error('Chart Data Error:', error);
        return res.status(500).json({
            success: false,
            result: [],
            message: 'Failed to fetch chart data',
            error: error.message,
        });
    }
};

module.exports = chartData;
