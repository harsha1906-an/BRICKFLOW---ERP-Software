const { getAll, getOne, runQuery } = require('../config/db');
const Unit = require('./unit.model');

const Booking = {
    // Get all bookings with customer and unit info
    findAll: async () => {
        try {
            const bookings = await getAll(`
        SELECT 
          b.*,
          c.name as customer_name,
          c.phone as customer_phone,
          u.unit_number,
          u.type as unit_type,
          p.name as project_name,
          COALESCE(SUM(pay.amount), 0) as total_paid
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN units u ON b.unit_id = u.id
        LEFT JOIN projects p ON u.project_id = p.id
        LEFT JOIN payments pay ON b.id = pay.booking_id
        GROUP BY b.id
        ORDER BY b.booking_date DESC
      `);

            // Calculate balance for each booking
            bookings.forEach(booking => {
                booking.balance = booking.agreed_price - booking.total_paid;
            });

            return bookings;
        } catch (error) {
            throw error;
        }
    },

    // Get booking by ID with payments
    findById: async (id) => {
        try {
            const booking = await getOne(`
        SELECT 
          b.*,
          c.name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email,
          u.unit_number,
          u.type as unit_type,
          p.name as project_name
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN units u ON b.unit_id = u.id
        LEFT JOIN projects p ON u.project_id = p.id
        WHERE b.id = ?
      `, [id]);

            if (booking) {
                // Get payments for this booking
                const payments = await getAll(
                    'SELECT * FROM payments WHERE booking_id = ? ORDER BY payment_date DESC',
                    [id]
                );
                booking.payments = payments;

                // Calculate totals
                const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                booking.total_paid = totalPaid;
                booking.balance = booking.agreed_price - totalPaid;
            }

            return booking;
        } catch (error) {
            throw error;
        }
    },

    // Create booking
    create: async (data) => {
        try {
            const { customer_id, unit_id, booking_date, agreed_price, notes } = data;

            // Check if unit is available
            const unit = await Unit.findById(unit_id);
            if (!unit) {
                throw new Error('Unit not found');
            }
            if (unit.status !== 'available') {
                throw new Error('Unit is not available for booking');
            }

            // Create booking
            const result = await runQuery(
                'INSERT INTO bookings (customer_id, unit_id, booking_date, agreed_price, notes) VALUES (?, ?, ?, ?, ?)',
                [customer_id, unit_id, booking_date, agreed_price, notes]
            );

            // Update unit status to 'booked'
            await runQuery(
                'UPDATE units SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['booked', unit_id]
            );

            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Update booking
    update: async (id, data) => {
        try {
            const { booking_date, agreed_price, status, notes } = data;

            // If status is being changed to 'completed', update unit to 'sold'
            if (status === 'completed') {
                const booking = await Booking.findById(id);
                await runQuery(
                    'UPDATE units SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    ['sold', booking.unit_id]
                );
            }

            await runQuery(
                'UPDATE bookings SET booking_date = ?, agreed_price = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [booking_date, agreed_price, status, notes, id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Get balance for a booking
    getBalance: async (id) => {
        try {
            const result = await getOne(`
        SELECT 
          b.agreed_price,
          COALESCE(SUM(p.amount), 0) as total_paid
        FROM bookings b
        LEFT JOIN payments p ON b.id = p.booking_id
        WHERE b.id = ?
        GROUP BY b.id
      `, [id]);

            if (!result) {
                throw new Error('Booking not found');
            }

            return {
                agreed_price: result.agreed_price,
                total_paid: result.total_paid,
                balance: result.agreed_price - result.total_paid
            };
        } catch (error) {
            throw error;
        }
    },

    // Get payment status
    getPaymentStatus: async (id) => {
        try {
            const balanceInfo = await Booking.getBalance(id);

            if (balanceInfo.balance < 0) return 'overpaid';
            if (balanceInfo.balance === 0) return 'paid';
            if (balanceInfo.total_paid > 0) return 'partial';
            return 'pending';
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Booking;
