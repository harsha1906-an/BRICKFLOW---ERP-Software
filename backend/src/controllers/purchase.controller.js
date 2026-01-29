const Purchase = require('../models/purchase.model');
const Supplier = require('../models/supplier.model');
const AuditService = require('../services/auditService');

// Get all purchases
const getAllPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.findAll();
        res.json({ success: true, data: purchases });
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
    }
};

// Get purchase by ID
const getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;
        const purchase = await Purchase.findById(id);

        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Purchase not found' });
        }

        res.json({ success: true, data: purchase });
    } catch (error) {
        console.error('Get purchase error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch purchase' });
    }
};

// Create purchase
const createPurchase = async (req, res) => {
    try {
        const { supplier_id, purchase_date, total_amount, notes, items } = req.body;

        // Validation
        if (!supplier_id || !purchase_date || !total_amount || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Supplier, date, total amount, and items are required' });
        }

        // Check if supplier exists
        const supplier = await Supplier.findById(supplier_id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        // Validate items
        for (const item of items) {
            if (!item.material_id || !item.quantity || !item.rate) {
                return res.status(400).json({ success: false, message: 'Each item must have material, quantity, and rate' });
            }
            if (item.quantity <= 0 || item.rate < 0) {
                return res.status(400).json({ success: false, message: 'Quantity must be positive and rate must be non-negative' });
            }
        }

        const purchaseId = await Purchase.create({
            supplier_id,
            purchase_date,
            total_amount,
            notes,
            items,
            created_by: req.user.id
        });
        res.status(201).json({ success: true, message: 'Purchase created successfully', data: { id: purchaseId } });
    } catch (error) {
        console.error('Create purchase error:', error);
        res.status(500).json({ success: false, message: 'Failed to create purchase' });
    }
};

// Update purchase
const updatePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const { supplier_id, purchase_date, total_amount, notes, items } = req.body;

        // Validation
        if (!supplier_id || !purchase_date || !total_amount || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Supplier, date, total amount, and items are required' });
        }

        // Check if supplier exists
        const supplier = await Supplier.findById(supplier_id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        const oldPurchase = await Purchase.findById(id);

        await Purchase.update(id, { supplier_id, purchase_date, total_amount, notes, items });

        // Audit Log
        if (oldPurchase) {
            await AuditService.log(
                req.user ? req.user.id : null,
                'UPDATE', 'purchases', id,
                oldPurchase, { supplier_id, purchase_date, total_amount, notes, items },
                req
            );
        }

        res.json({ success: true, message: 'Purchase updated successfully' });
    } catch (error) {
        console.error('Update purchase error:', error);
        if (error.message === 'Purchase not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message === 'Only draft purchases can be updated') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to update purchase' });
    }
};

// Confirm purchase
const confirmPurchase = async (req, res) => {
    try {
        const { id } = req.params;

        const oldPurchase = await Purchase.findById(id); // For audit

        await Purchase.confirm(id);

        // Audit Log
        if (oldPurchase) {
            await AuditService.log(
                req.user ? req.user.id : null,
                'CONFIRM', 'purchases', id,
                oldPurchase, { status: 'confirmed' },
                req
            );
        }

        // Record Approval
        try {
            const { runQuery } = require('../config/db');
            await runQuery(
                `INSERT INTO approvals (entity_type, entity_id, requester_id, status, actioned_by, action_date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                ['purchase_order', id, req.user.id, 'approved', req.user.id]
            );
        } catch (e) {
            console.error('Failed to record approval:', e.message);
        }
        res.json({ success: true, message: 'Purchase confirmed and inventory updated successfully' });
    } catch (error) {
        console.error('Confirm purchase error:', error);
        if (error.message === 'Purchase not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message === 'Only draft purchases can be confirmed') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to confirm purchase' });
    }
};

// Cancel purchase
const cancelPurchase = async (req, res) => {
    try {
        const { id } = req.params;

        const oldPurchase = await Purchase.findById(id); // For audit

        await Purchase.cancel(id);

        // Audit Log
        if (oldPurchase) {
            await AuditService.log(
                req.user ? req.user.id : null,
                'CANCEL', 'purchases', id,
                oldPurchase, { status: 'cancelled' },
                req
            );
        }

        res.json({ success: true, message: 'Purchase cancelled and inventory reversed successfully' });
    } catch (error) {
        console.error('Cancel purchase error:', error);
        if (error.message === 'Purchase not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message === 'Only confirmed purchases can be cancelled') {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message && error.message.includes('Insufficient stock')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to cancel purchase' });
    }
};

// Delete purchase
const deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;

        await Purchase.delete(id);
        res.json({ success: true, message: 'Purchase deleted successfully' });
    } catch (error) {
        console.error('Delete purchase error:', error);
        if (error.message === 'Purchase not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message === 'Only draft purchases can be deleted') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to delete purchase' });
    }
};

module.exports = {
    getAllPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    confirmPurchase,
    cancelPurchase,
    deletePurchase
};
