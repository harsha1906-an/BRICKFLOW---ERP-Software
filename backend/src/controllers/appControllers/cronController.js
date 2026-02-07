const mongoose = require('mongoose');
const moment = require('moment');
const cron = require('node-cron');
const { Resend } = require('resend');
const { dailySummary } = require('@/emailTemplate/dailySummary');

const Payment = mongoose.model('Payment');
const Booking = mongoose.model('Booking');
const PettyCashTransaction = mongoose.model('PettyCashTransaction');
const InventoryTransaction = mongoose.model('InventoryTransaction');
const GoodsReceipt = mongoose.model('GoodsReceipt');
const Admin = mongoose.model('Admin');

const runDailySummary = async (manualRecipient = null) => {
    try {
        console.log('--- Starting Daily Summary Cron Job ---');
        // Fix: Use IST Timezone
        const startOfDay = moment().utcOffset('+05:30').startOf('day').toDate();
        const endOfDay = moment().utcOffset('+05:30').endOf('day').toDate();

        console.log(`Report Window: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

        // 1. Fetch Today's Income (Payments)
        const payments = await Payment.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            removed: false
        });
        const officialIncome = payments.filter(p => p.ledger === 'official').reduce((sum, p) => sum + p.amount, 0);
        const internalIncome = payments.filter(p => p.ledger === 'internal').reduce((sum, p) => sum + p.amount, 0);
        const totalIncome = officialIncome + internalIncome;
        console.log(`Found ${payments.length} payments. Official: ${officialIncome}, Internal: ${internalIncome}`);

        // 2. Fetch Expenses (Combined)
        const [pettyCash, mainExpenses] = await Promise.all([
            PettyCashTransaction.find({
                date: { $gte: startOfDay, $lte: endOfDay },
                type: 'outward',
                removed: false
            }),
            mongoose.model('Expense').find({
                date: { $gte: startOfDay, $lte: endOfDay },
                removed: false
            })
        ]);

        const pettyCashExpenses = pettyCash.reduce((sum, e) => sum + e.amount, 0);

        const supplierExpenses = mainExpenses
            .filter(e => e.recipientType === 'Supplier')
            .reduce((sum, e) => sum + e.amount, 0);

        const labourExpenses = mainExpenses
            .filter(e => e.recipientType === 'Labour')
            .reduce((sum, e) => sum + e.amount, 0);

        const otherExpenses = mainExpenses
            .filter(e => e.recipientType === 'Other')
            .reduce((sum, e) => sum + e.amount, 0);

        const totalExpenses = pettyCashExpenses + supplierExpenses + labourExpenses + otherExpenses;

        console.log(`Expenses Breakdown: PettyCash=${pettyCashExpenses}, Supplier=${supplierExpenses}, Labour=${labourExpenses}, Other=${otherExpenses}`);

        // 3. Fetch New Bookings
        const bookings = await Booking.find({
            bookingDate: { $gte: startOfDay, $lte: endOfDay },
            removed: false
        }).populate('client villa');
        console.log(`Found ${bookings.length} new bookings`);

        // 4. Fetch Inventory Logs (Check both Transactions and Receipts)
        const [invLogs, receipts] = await Promise.all([
            InventoryTransaction.find({
                date: { $gte: startOfDay, $lte: endOfDay }
            }).populate('material'),
            GoodsReceipt.find({
                date: { $gte: startOfDay, $lte: endOfDay }
            }).populate('items.material')
        ]);

        let mergedLogs = [...invLogs];

        // Convert GoodsReceipt items to similar format for email
        receipts.forEach(receipt => {
            receipt.items.forEach(item => {
                mergedLogs.push({
                    material: item.material,
                    type: 'inward (Receipt)',
                    quantity: item.quantity
                });
            });
        });

        console.log(`Found ${invLogs.length} inventory transactions and ${receipts.length} receipts`);

        // 5. Get Recipient (Manual override or First Owner)
        const admin = await Admin.findOne({ role: 'owner', removed: false });
        const recipientEmail = manualRecipient || (admin ? admin.email : process.env.ADMIN_EMAIL);

        if (!recipientEmail || !process.env.RESEND_API) {
            console.error('Missing email configuration (RESEND_API or recipient email)');
            return;
        }

        // 6. Send Email
        const resend = new Resend(process.env.RESEND_API);
        const htmlContent = dailySummary({
            income: totalIncome,
            officialIncome,
            internalIncome,
            expenses: totalExpenses,
            breakdown: {
                pettyCash: pettyCashExpenses,
                supplier: supplierExpenses,
                labour: labourExpenses,
                other: otherExpenses
            },
            bookings,
            inventoryLogs: mergedLogs,
            date: moment().utcOffset('+05:30').format('DD/MM/YYYY')
        });

        const { data, error } = await resend.emails.send({
            from: 'BrickFlow <onboarding@resend.dev>',
            to: recipientEmail,
            subject: `Daily Summary - ${moment().utcOffset('+05:30').format('DD/MM/YYYY')}`,
            html: htmlContent
        });

        if (error) {
            console.error('Failed to send daily summary:', error);
        } else {
            console.log('Daily summary sent successfully:', data.id);
        }

    } catch (err) {
        console.error('Error in Daily Summary Cron:', err);
    }
};

// Schedule: 8:00 PM every day
const initCron = () => {
    // 0 20 * * * = 8:00 PM
    cron.schedule('0 20 * * *', () => {
        runDailySummary();
    });
    console.log('Daily Summary Cron Scheduled for 8:00 PM');
};

module.exports = {
    initCron,
    runDailySummary // Export for manual trigger/testing
};
