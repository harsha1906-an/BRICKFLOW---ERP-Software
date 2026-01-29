const { getAll, getOne, runQuery } = require('../config/db');

const PurchaseOrder = {
    // Get all POs
    findAll: async () => {
        try {
            const pos = await getAll(`
        SELECT 
          po.*,
          p.name as project_name,
          s.name as supplier_name,
          u.name as created_by_name,
          (SELECT COUNT(*) FROM purchase_order_items WHERE po_id = po.id) as item_count
        FROM purchase_orders po
        LEFT JOIN projects p ON po.project_id = p.id
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN users u ON po.created_by = u.id
        ORDER BY po.created_at DESC
      `);
            return pos;
        } catch (error) {
            throw error;
        }
    },

    // Get PO by ID with items
    findById: async (id) => {
        try {
            const po = await getOne(`
        SELECT 
          po.*,
          p.name as project_name,
          s.name as supplier_name,
          u.name as created_by_name,
          ua.name as approved_by_name
        FROM purchase_orders po
        LEFT JOIN projects p ON po.project_id = p.id
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN users u ON po.created_by = u.id
        LEFT JOIN users ua ON po.approved_by = ua.id
        WHERE po.id = ?
      `, [id]);

            if (po) {
                const items = await getAll(`
          SELECT 
            poi.*,
            m.name as material_name,
            m.unit
          FROM purchase_order_items poi
          LEFT JOIN materials m ON poi.material_id = m.id
          WHERE poi.po_id = ?
        `, [id]);
                po.items = items;
            }
            return po;
        } catch (error) {
            throw error;
        }
    },

    // Create PO
    create: async (data, userId) => {
        try {
            const { project_id, supplier_id, order_date, expected_delivery_date, notes, items } = data;

            // Generate PO Number (Simple logic: PO-YYYYMMDD-Random)
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(1000 + Math.random() * 9000);
            const po_number = `PO-${dateStr}-${random}`;

            // Calculate total amount
            const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

            const result = await runQuery(
                `INSERT INTO purchase_orders 
         (po_number, project_id, supplier_id, order_date, expected_delivery_date, notes, created_by, total_amount, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
                [po_number, project_id, supplier_id, order_date, expected_delivery_date, notes, userId, total_amount]
            );

            const poId = result.id;

            // Insert items
            for (const item of items) {
                await runQuery(
                    `INSERT INTO purchase_order_items (po_id, material_id, quantity, unit_price, total_price, notes) 
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [poId, item.material_id, item.quantity, item.unit_price, item.quantity * item.unit_price, item.notes]
                );
            }

            return poId;
        } catch (error) {
            throw error;
        }
    },

    // Update Status
    updateStatus: async (id, status, userId) => {
        try {
            let query = 'UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP';
            const params = [status];

            if (status === 'approved') {
                query += ', approved_by = ?';
                params.push(userId);
            }

            query += ' WHERE id = ?';
            params.push(id);

            await runQuery(query, params);

            // If status is 'received', we should technically auto-add to inventory (Optional automation)
            // For now, let's keep it manual or triggered separately

            return true;
        } catch (error) {
            throw error;
        }
    },

    getNextPONumber: async () => {
        // Helper for UI to show what might be next, though generation happens on server
        return `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-XXXX`;
    }
};

module.exports = PurchaseOrder;
