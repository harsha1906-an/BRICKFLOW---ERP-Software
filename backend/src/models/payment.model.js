const { getAll, getOne, runQuery } = require('../config/db');
const Booking = require('./booking.model');
const PaymentMethod = require('./paymentMethod.model');

const Payment = {
    // Get all payments with booking info
    findAll: async () => {
        try {
            const payments = await getAll(`
        SELECT 
          p.*,
          pm.code as payment_method_code,
          pm.name as payment_method_name,
          b.agreed_price,
          c.name as customer_name,
          u.unit_number,
          proj.name as project_name
        FROM payments p
        LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
        LEFT JOIN bookings b ON p.booking_id = b.id
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN units u ON b.unit_id = u.id
        LEFT JOIN projects proj ON u.project_id = proj.id
        ORDER BY p.payment_date DESC
      `);
            return payments;
        } catch (error) {
            throw error;
        }
    },

    // Get payments by booking
    findByBooking: async (bookingId) => {
        try {
            const payments = await getAll(
                'SELECT * FROM payments WHERE booking_id = ? ORDER BY payment_date DESC',
                [bookingId]
            );
            return payments;
        } catch (error) {
            throw error;
        }
    },

    // Get payment by ID with all related info
    findById: async (paymentId) => {
        try {
            const payment = await getOne(`
                SELECT 
                    p.*,
                    pm.code as payment_method_code,
                    pm.name as payment_method_name,
                    b.agreed_price as total_amount,
                    b.unit_id,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    u.unit_number as unit_name
                FROM payments p
                LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
                LEFT JOIN bookings b ON p.booking_id = b.id
                LEFT JOIN customers c ON b.customer_id = c.id
                LEFT JOIN units u ON b.unit_id = u.id
                WHERE p.id = ?
            `, [paymentId]);

            if (!payment) {
                return null;
            }

            // Get total paid and outstanding
            const totalPaid = await Payment.getTotalPaid(payment.booking_id);
            payment.paid_amount = totalPaid;
            payment.outstanding = payment.total_amount - totalPaid;

            return payment;
        } catch (error) {
            throw error;
        }
    },

    // Create payment
    create: async (data) => {
        try {
            const {
                booking_id, payment_date, amount, payment_method, reference_number, notes,
                allow_overpayment, has_gst, gst_percentage, accounting_type
            } = data;

            // CRITICAL FIX: Wrap in transaction to prevent race conditions
            const { runTransaction } = require('../config/db');

            return await runTransaction(async () => {
                // Check if booking exists (in transaction)
                const booking = await Booking.findById(booking_id);
                if (!booking) {
                    throw new Error('Booking not found');
                }

                // Check for overpayment (Atomic Check)
                const overpaymentCheck = await Payment.checkOverpayment(booking_id, amount);

                if (overpaymentCheck.isOverpayment && !allow_overpayment) {
                    throw new Error(
                        `Overpayment blocked. Current balance: ₹${overpaymentCheck.currentBalance.toFixed(2)}, ` +
                        `Payment amount: ₹${amount.toFixed(2)}, ` +
                        `Excess: ₹${overpaymentCheck.excessAmount.toFixed(2)}. ` +
                        `Maximum allowed payment is ₹${overpaymentCheck.currentBalance.toFixed(2)}.`
                    );
                }

                // Calculate GST
                let gst_amount = 0;

                // CRITICAL FIX: Use accounting_type ENUM
                // GST applies ONLY if accounting_type === 'ACCOUNTABLE'
                if (accounting_type === 'ACCOUNTABLE' && has_gst && gst_percentage) {
                    const { calculateGST } = require('../utils/gstHelper');
                    const gstCalc = calculateGST(amount, gst_percentage);
                    gst_amount = gstCalc.gst_amount;
                } else {
                    // Force GST to 0 for NON_ACCOUNTABLE
                    gst_amount = 0;
                }

                // Resolve Payment Method ID
                let methodId = payment_method;
                if (typeof payment_method === 'string') {
                    const method = await PaymentMethod.findByCode(payment_method);
                    if (!method) throw new Error(`Invalid payment method: ${payment_method}`);
                    methodId = method.id;
                }

                // Create payment
                const result = await runQuery(
                    `INSERT INTO payments (
                        booking_id, payment_date, amount, payment_method_id, reference_number, notes,
                        has_gst, gst_percentage, gst_amount, accounting_type, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        booking_id, payment_date, amount, methodId, reference_number, notes,
                        has_gst ? 1 : 0, gst_percentage || 0, gst_amount, accounting_type,
                        data.created_by // Insert created_by
                    ]
                );

                // Update booking status if fully paid
                const balanceInfo = await Booking.getBalance(booking_id);
                if (balanceInfo.balance <= 0) {
                    await runQuery(
                        'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        ['completed', booking_id]
                    );
                    await runQuery(
                        'UPDATE units SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT unit_id FROM bookings WHERE id = ?)',
                        ['sold', booking_id]
                    );
                }

                return {
                    id: result.id,
                    overpayment: overpaymentCheck,
                    was_overpayment_allowed: allow_overpayment && overpaymentCheck.isOverpayment,
                    gst_amount: gst_amount,
                    accounting_type
                };
            });
        } catch (error) {
            throw error;
        }
    },

    // Get total paid for a booking
    getTotalPaid: async (bookingId) => {
        try {
            const result = await getOne(
                'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE booking_id = ?',
                [bookingId]
            );
            return result.total;
        } catch (error) {
            throw error;
        }
    },

    // Check if payment would cause overpayment
    checkOverpayment: async (bookingId, newAmount) => {
        try {
            const balanceInfo = await Booking.getBalance(bookingId);
            const afterPayment = balanceInfo.balance - newAmount;

            return {
                isOverpayment: afterPayment < 0,
                excessAmount: afterPayment < 0 ? Math.abs(afterPayment) : 0,
                currentBalance: balanceInfo.balance
            };
        } catch (error) {
            throw error;
        }
    },

    // Get outstanding balance for a booking
    getOutstandingBalance: async (bookingId) => {
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                throw new Error('Booking not found');
            }

            const totalPaid = await Payment.getTotalPaid(bookingId);
            const outstanding = booking.agreed_price - totalPaid;

            return {
                booking_id: bookingId,
                agreed_price: booking.agreed_price,
                total_paid: totalPaid,
                outstanding_balance: outstanding,
                is_fully_paid: outstanding <= 0,
                is_overpaid: outstanding < 0
            };
        } catch (error) {
            throw error;
        }
    },

    // Get payment summary
    getSummary: async () => {
        try {
            const summary = await getOne(`
        SELECT 
          COUNT(DISTINCT b.id) as total_bookings,
          SUM(b.agreed_price) as total_agreed_value,
          COALESCE(SUM(p.amount), 0) as total_collected,
          SUM(b.agreed_price) - COALESCE(SUM(p.amount), 0) as total_outstanding
        FROM bookings b
        LEFT JOIN payments p ON b.id = p.booking_id
        WHERE b.status != 'cancelled'
      `);

            // Count overpayments
            const overpayments = await getOne(`
        SELECT COUNT(*) as count
        FROM (
          SELECT 
            b.id,
            b.agreed_price - COALESCE(SUM(p.amount), 0) as balance
          FROM bookings b
          LEFT JOIN payments p ON b.id = p.booking_id
          WHERE b.status != 'cancelled'
          GROUP BY b.id
          HAVING balance < 0
        )
      `);

            summary.overpayment_count = overpayments.count;

            return summary;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Payment;
