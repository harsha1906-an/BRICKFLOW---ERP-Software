const { getAll, getOne, runQuery, db } = require('../config/db');
const Inventory = require('./inventory.model');

const Purchase = {
    // Get all purchases with supplier info
    findAll: async () => {
        try {
            const purchases = await getAll(`
        SELECT 
          p.*,
          s.name as supplier_name
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.created_at DESC
      `);
            return purchases;
        } catch (error) {
            throw error;
        }
    },

    // Get purchase by ID with items
    findById: async (id) => {
        try {
            const purchase = await getOne(`
        SELECT 
          p.*,
          s.name as supplier_name,
          s.contact_person,
          s.phone
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `, [id]);

            if (purchase) {
                // Get purchase items
                const items = await getAll(`
          SELECT 
            pi.*,
            m.name as material_name,
            m.unit as material_unit
          FROM purchase_items pi
          LEFT JOIN materials m ON pi.material_id = m.id
          WHERE pi.purchase_id = ?
        `, [id]);
                purchase.items = items;
            }

            return purchase;
        } catch (error) {
            throw error;
        }
    },

    // Create new purchase (draft status)
    create: async (data) => {
        try {
            const {
                supplier_id, purchase_date, total_amount, notes, items,
                has_gst, gst_percentage, is_accountable
            } = data;

            // Calculate GST and base amount if applicable
            let base_amount = total_amount;
            let gst_amount = 0;

            if (has_gst && gst_percentage) {
                const { calculateGSTFromTotal } = require('../utils/gstHelper');
                const gstCalc = calculateGSTFromTotal(total_amount, gst_percentage);
                base_amount = gstCalc.base_amount;
                gst_amount = gstCalc.gst_amount;
            }

            // Create purchase record with GST fields
            const purchaseResult = await runQuery(
                `INSERT INTO purchases (
                    supplier_id, purchase_date, total_amount, base_amount,
                    has_gst, gst_percentage, gst_amount, is_accountable,
                    status, notes, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    supplier_id, purchase_date, total_amount, base_amount,
                    has_gst ? 1 : 0, gst_percentage || 0, gst_amount, is_accountable !== undefined ? is_accountable : 1,
                    'draft', notes, data.created_by
                ]
            );

            const purchaseId = purchaseResult.id;

            // Create purchase items
            if (items && items.length > 0) {
                for (const item of items) {
                    await runQuery(
                        'INSERT INTO purchase_items (purchase_id, material_id, quantity, rate, amount) VALUES (?, ?, ?, ?, ?)',
                        [purchaseId, item.material_id, item.quantity, item.rate, item.amount]
                    );
                }
            }

            return purchaseId;
        } catch (error) {
            throw error;
        }
    },

    // Update purchase (only if draft)
    update: async (id, data) => {
        try {
            const { supplier_id, purchase_date, total_amount, notes, items } = data;

            // Check if purchase is draft
            const purchase = await Purchase.findById(id);
            if (!purchase) {
                throw new Error('Purchase not found');
            }
            if (purchase.status !== 'draft') {
                throw new Error('Only draft purchases can be updated');
            }

            // Update purchase record
            await runQuery(
                'UPDATE purchases SET supplier_id = ?, purchase_date = ?, total_amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [supplier_id, purchase_date, total_amount, notes, id]
            );

            // Delete existing items
            await runQuery('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);

            // Create new items
            if (items && items.length > 0) {
                for (const item of items) {
                    await runQuery(
                        'INSERT INTO purchase_items (purchase_id, material_id, quantity, rate, amount) VALUES (?, ?, ?, ?, ?)',
                        [id, item.material_id, item.quantity, item.rate, item.amount]
                    );
                }
            }

            return true;
        } catch (error) {
            throw error;
        }
    },

    // Confirm purchase - creates inventory IN transactions
    confirm: async (id) => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                (async () => {
                    try {
                        // Get purchase with items
                        const purchase = await Purchase.findById(id);

                        if (!purchase) {
                            db.run('ROLLBACK');
                            return reject(new Error('Purchase not found'));
                        }

                        if (purchase.status !== 'draft') {
                            db.run('ROLLBACK');
                            return reject(new Error('Only draft purchases can be confirmed'));
                        }

                        // Update purchase status to confirmed
                        await runQuery('UPDATE purchases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['confirmed', id]);

                        // Create inventory IN transactions for each item
                        for (const item of purchase.items) {
                            await Inventory.createTransaction({
                                material_id: item.material_id,
                                project_id: null,
                                type: 'IN',
                                quantity: item.quantity,
                                reference_type: 'purchase',
                                reference_id: id,
                                notes: `Purchase #${id} - ${purchase.supplier_name}`
                            });
                        }

                        db.run('COMMIT');
                        resolve(true);
                    } catch (error) {
                        db.run('ROLLBACK');
                        reject(error);
                    }
                })();
            });
        });
    },

    // Cancel purchase - creates inventory OUT transactions to reverse
    cancel: async (id) => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                (async () => {
                    try {
                        // Get purchase with items
                        const purchase = await Purchase.findById(id);

                        if (!purchase) {
                            db.run('ROLLBACK');
                            return reject(new Error('Purchase not found'));
                        }

                        if (purchase.status !== 'confirmed') {
                            db.run('ROLLBACK');
                            return reject(new Error('Only confirmed purchases can be cancelled'));
                        }

                        // Check if sufficient stock exists for reversal
                        for (const item of purchase.items) {
                            const currentStock = await Inventory.getCurrentStock(item.material_id);
                            if (currentStock < item.quantity) {
                                db.run('ROLLBACK');
                                return reject(new Error(`Insufficient stock for ${item.material_name}. Available: ${currentStock}, Required: ${item.quantity}`));
                            }
                        }

                        // Update purchase status to cancelled
                        await runQuery('UPDATE purchases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['cancelled', id]);

                        // Create inventory OUT transactions to reverse the IN
                        for (const item of purchase.items) {
                            await Inventory.createTransaction({
                                material_id: item.material_id,
                                project_id: null,
                                type: 'OUT',
                                quantity: item.quantity,
                                reference_type: 'adjustment',
                                reference_id: id,
                                notes: `Purchase #${id} cancelled - ${purchase.supplier_name}`
                            });
                        }

                        db.run('COMMIT');
                        resolve(true);
                    } catch (error) {
                        db.run('ROLLBACK');
                        reject(error);
                    }
                })();
            });
        });
    },

    // Delete purchase (only if draft)
    delete: async (id) => {
        try {
            const purchase = await Purchase.findById(id);
            if (!purchase) {
                throw new Error('Purchase not found');
            }
            if (purchase.status !== 'draft') {
                throw new Error('Only draft purchases can be deleted');
            }

            // Delete purchase items first
            await runQuery('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);

            // Delete purchase
            await runQuery('DELETE FROM purchases WHERE id = ?', [id]);

            return true;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Purchase;
