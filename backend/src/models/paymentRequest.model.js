const { getAll, getOne, run } = require('../config/db');

const PaymentRequest = {
    /**
     * Create a new payment request
     */
    create: async (data) => {
        const query = `
            INSERT INTO payment_requests (
                booking_id, customer_id, amount_requested, due_date,
                request_date, notes, created_by, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        const result = await run(query, [
            data.booking_id,
            data.customer_id,
            data.amount_requested,
            data.due_date,
            data.request_date || new Date().toISOString().split('T')[0],
            data.notes,
            data.created_by
        ]);

        return result.lastID;
    },

    /**
     * Find all payment requests with filters
     */
    findAll: async (filters = {}) => {
        let query = `
            SELECT 
                pr.*,
                c.name as customer_name,
                c.phone as customer_phone,
                b.agreed_price,
                u.unit_number,
                p.name as project_name,
                usr.name as created_by_name
            FROM payment_requests pr
            JOIN customers c ON pr.customer_id = c.id
            JOIN bookings b ON pr.booking_id = b.id
            JOIN units u ON b.unit_id = u.id
            JOIN projects p ON u.project_id = p.id
            LEFT JOIN users usr ON pr.created_by = usr.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ` AND pr.status = ?`;
            params.push(filters.status);
        }

        if (filters.customerId) {
            query += ` AND pr.customer_id = ?`;
            params.push(filters.customerId);
        }

        if (filters.bookingId) {
            query += ` AND pr.booking_id = ?`;
            params.push(filters.bookingId);
        }

        if (filters.startDate) {
            query += ` AND pr.due_date >= ?`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ` AND pr.due_date <= ?`;
            params.push(filters.endDate);
        }

        query += ` ORDER BY pr.due_date ASC, pr.created_at DESC`;

        return await getAll(query, params);
    },

    /**
     * Find by ID
     */
    findById: async (id) => {
        const query = `
            SELECT 
                pr.*,
                c.name as customer_name,
                c.phone as customer_phone,
                c.email as customer_email,
                b.agreed_price,
                u.unit_number,
                p.name as project_name
            FROM payment_requests pr
            JOIN customers c ON pr.customer_id = c.id
            JOIN bookings b ON pr.booking_id = b.id
            JOIN units u ON b.unit_id = u.id
            JOIN projects p ON u.project_id = p.id
            WHERE pr.id = ?
        `;
        return await getOne(query, [id]);
    },

    /**
     * Update status
     */
    updateStatus: async (id, status, paymentId = null) => {
        const query = `
            UPDATE payment_requests 
            SET status = ?, payment_id = ?
            WHERE id = ?
        `;
        await run(query, [status, paymentId, id]);
    },

    /**
     * Send reminder (increment counter)
     */
    sendReminder: async (id) => {
        const query = `
            UPDATE payment_requests 
            SET reminder_count = reminder_count + 1,
                last_reminder_date = ?
            WHERE id = ?
        `;
        const today = new Date().toISOString().split('T')[0];
        await run(query, [today, id]);
    },

    /**
     * Update overdue requests
     */
    updateOverdueRequests: async () => {
        const today = new Date().toISOString().split('T')[0];
        const query = `
            UPDATE payment_requests 
            SET status = 'overdue'
            WHERE status = 'pending' AND due_date < ?
        `;
        await run(query, [today]);
    }
};

module.exports = PaymentRequest;
