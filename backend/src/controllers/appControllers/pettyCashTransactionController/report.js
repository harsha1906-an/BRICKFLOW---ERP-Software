const mongoose = require('mongoose');
const PettyCashTransaction = mongoose.model('PettyCashTransaction');
const moment = require('moment');
const { generatePdf } = require('@/controllers/pdfController');

const report = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }

        const targetDate = moment(date, 'YYYY-MM-DD').startOf('day');
        const endDate = moment(date, 'YYYY-MM-DD').endOf('day');

        // 1. Calculate Summary Totals (All transactions up to endDate)
        const allTransactionsQuery = await PettyCashTransaction.aggregate([
            {
                $match: {
                    removed: false,
                    date: { $lte: endDate.toDate() }
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        let totalCashReceived = 0;
        let totalExpenses = 0;
        allTransactionsQuery.forEach(item => {
            if (item._id === 'inward') totalCashReceived = item.total;
            if (item._id === 'outward') totalExpenses = item.total;
        });
        const currentBalance = totalCashReceived - totalExpenses;

        // 2. Get transactions (showing history up to this date)
        const ledgerTransactions = await PettyCashTransaction.find({
            removed: false,
            date: {
                $lte: endDate.toDate()
            }
        }).sort({ date: 1, created: 1 });

        // 3. Prepare data for PDF with running balance
        let balanceAcc = 0;
        const items = ledgerTransactions.map(item => {
            if (item.type === 'inward') balanceAcc += item.amount;
            if (item.type === 'outward') balanceAcc -= item.amount;
            return {
                ...item.toObject(),
                runningBalance: balanceAcc
            };
        });

        const result = {
            date: targetDate.toDate(),
            totalCashReceived,
            totalExpenses,
            currentBalance,
            items,
            manager: 'Manoja Kumar'
        };

        // 4. Generate PDF
        const pdfBuffer = await generatePdf(
            'pettycashreport',
            { filename: `PettyCashReport_${date}`, format: 'A4', landscape: false },
            result
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=PettyCashReport_${date}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        return res.send(Buffer.from(pdfBuffer));

    } catch (err) {
        console.error('Petty Cash Report Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Error generating report',
            error: err.message
        });
    }
};

module.exports = report;
