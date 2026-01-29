const { getAll, getOne, runQuery } = require('../config/db');

const Customer = {
    // Get all customers with booking count and status
    findAll: async () => {
        try {
            const customers = await getAll(`
        SELECT 
          c.*,
          COUNT(b.id) as booking_count
        FROM customers c
        LEFT JOIN bookings b ON c.id = b.customer_id
        GROUP BY c.id
        HAVING c.is_active = 1
        ORDER BY c.created_at DESC
      `);
            return customers;
        } catch (error) {
            throw error;
        }
    },

    // Get customer by ID with bookings and analytics history
    findById: async (id) => {
        try {
            const customer = await getOne('SELECT * FROM customers WHERE id = ? AND is_active = 1', [id]);

            if (customer) {
                // Get customer's bookings
                const bookings = await getAll(`
          SELECT 
            b.*,
            u.unit_number,
            u.type as unit_type,
            p.name as project_name
          FROM bookings b
          LEFT JOIN units u ON b.unit_id = u.id
          LEFT JOIN projects p ON u.project_id = p.id
          WHERE b.customer_id = ?
          ORDER BY b.booking_date DESC
        `, [id]);

                // Get visit history
                const visits = await getAll('SELECT * FROM customer_visits WHERE customer_id = ? ORDER BY visit_date DESC', [id]);

                // Get status history
                const statusHistory = await getAll('SELECT * FROM customer_status WHERE customer_id = ? ORDER BY status_date DESC', [id]);

                customer.bookings = bookings;
                customer.visits = visits;
                customer.statusHistory = statusHistory;
            }

            return customer;
        } catch (error) {
            throw error;
        }
    },

    // Create customer with analytics fields
    create: async (data, userId = null) => {
        try {
            const { name, phone, email, address, source, current_status = 'new' } = data;
            const result = await runQuery(
                'INSERT INTO customers (name, phone, email, address, source, current_status) VALUES (?, ?, ?, ?, ?, ?)',
                [name, phone, email, address, source, current_status]
            );

            // Log initial status
            if (result.id) {
                await runQuery(
                    'INSERT INTO customer_status (customer_id, status, status_date, assigned_to) VALUES (?, ?, DATE("now"), ?)',
                    [result.id, current_status, userId]
                );
            }
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Update customer including analytics fields
    update: async (id, data) => {
        try {
            const { name, phone, email, address, source, current_status, assigned_to } = data;

            await runQuery(
                'UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, source = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, phone, email, address, source, assigned_to, id]
            );

            // Handle status change
            if (current_status) {
                const current = await getOne('SELECT current_status FROM customers WHERE id = ?', [id]);
                if (current && current.current_status !== current_status) {
                    await runQuery('UPDATE customers SET current_status = ? WHERE id = ?', [current_status, id]);
                    await runQuery(
                        'INSERT INTO customer_status (customer_id, status, status_date, assigned_to) VALUES (?, ?, DATE("now"), ?)',
                        [id, current_status, assigned_to]
                    );
                }
            }
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Delete customer (only if no bookings)
    delete: async (id) => {
        try {
            const hasBookings = await Customer.hasBookings(id);
            if (hasBookings) {
                throw new Error('Cannot delete customer with existing bookings');
            }
            // Soft Delete Only - Preserve history
            // await runQuery('DELETE FROM customer_visits WHERE customer_id = ?', [id]);
            // await runQuery('DELETE FROM customer_status WHERE customer_id = ?', [id]);
            // await runQuery('DELETE FROM customer_lost_reasons WHERE customer_id = ?', [id]);

            await runQuery('UPDATE customers SET is_active = 0 WHERE id = ?', [id]);
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Check if customer has bookings
    hasBookings: async (id) => {
        try {
            const result = await getOne(
                'SELECT COUNT(*) as count FROM bookings WHERE customer_id = ?',
                [id]
            );
            return result.count > 0;
        } catch (error) {
            throw error;
        }
    },

    // --- Analytics Methods ---

    addVisit: async (data) => {
        try {
            const { customer_id, visit_date, visit_type, project_id, unit_id, budget_min, budget_max, source, notes } = data;
            const result = await runQuery(
                `INSERT INTO customer_visits 
                 (customer_id, visit_date, visit_type, project_id, unit_id, budget_min, budget_max, source, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [customer_id, visit_date || new Date().toISOString().split('T')[0], visit_type, project_id, unit_id, budget_min, budget_max, source, notes]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    recordLost: async (data) => {
        try {
            const { customer_id, reason, detailed_reason, competitor_name } = data;

            // Update status to lost
            await runQuery('UPDATE customers SET current_status = ? WHERE id = ?', ['lost', customer_id]);

            await runQuery(
                `INSERT INTO customer_lost_reasons (customer_id, lost_date, reason, detailed_reason, competitor_name) 
                 VALUES (?, DATE("now"), ?, ?, ?)`,
                [customer_id, reason, detailed_reason, competitor_name]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    getAnalytics: async () => {
        try {
            const totalByStatus = await getAll('SELECT current_status, COUNT(*) as count FROM customers GROUP BY current_status');

            const totalResult = await getOne('SELECT COUNT(*) as count FROM customers');
            const convertedResult = await getOne(`SELECT COUNT(*) as count FROM customers WHERE current_status = 'converted'`);
            const conversionRate = totalResult.count > 0 ? (convertedResult.count / totalResult.count) * 100 : 0;

            const lostReasons = await getAll('SELECT reason, COUNT(*) as count FROM customer_lost_reasons GROUP BY reason');

            const pendingFollowUps = await getAll(`
                SELECT c.id, c.name, c.phone, cs.follow_up_date, cs.priority, cs.notes, cs.status 
                FROM customer_status cs
                JOIN customers c ON cs.customer_id = c.id
                WHERE cs.follow_up_date <= DATE("now") 
                AND c.current_status NOT IN ('converted', 'lost')
                AND cs.id IN (SELECT MAX(id) FROM customer_status GROUP BY customer_id)
                ORDER BY cs.follow_up_date ASC
            `);

            return {
                totalByStatus,
                conversionRate: Math.round(conversionRate * 100) / 100,
                lostReasons,
                pendingFollowUps
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Customer;
