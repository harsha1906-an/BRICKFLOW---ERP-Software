const Inventory = require('../models/inventory.model');
const Material = require('../models/material.model');
const Project = require('../models/project.model');
const PurchaseOrder = require('../models/purchaseOrder.model');

// Get stock summary for all materials (supports projectId query)
const getStockSummary = async (req, res) => {
    try {
        const { projectId } = req.query;
        const stock = await Inventory.getAllStock(projectId);
        res.json({ success: true, data: stock });
    } catch (error) {
        console.error('Get stock summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stock summary' });
    }
};

// Get stock for specific material
const getMaterialStock = async (req, res) => {
    try {
        const { materialId } = req.params;
        const { projectId } = req.query;

        const material = await Material.findById(materialId);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        const currentStock = await Inventory.getCurrentStock(materialId, projectId);
        res.json({ success: true, data: { material_id: materialId, current_stock: currentStock } });
    } catch (error) {
        console.error('Get material stock error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch material stock' });
    }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Inventory.findAll();
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('Get all transactions error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
    }
};

// Get transactions by material
const getTransactionsByMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const transactions = await Inventory.findByMaterial(materialId);
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('Get transactions by material error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
    }
};

// Get transactions by project
const getTransactionsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const transactions = await Inventory.findByProject(projectId);
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('Get transactions by project error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
    }
};

// Record stock IN
const recordStockIn = async (req, res) => {
    try {
        const { material_id, quantity, reference_type, reference_id, notes, project_id, usage_reason } = req.body;

        if (!material_id || !quantity || !reference_type) {
            return res.status(400).json({ success: false, message: 'Material, quantity, and reference type are required' });
        }

        // === CRITICAL: INVENTORY-PO LINKAGE AUTO-ENFORCEMENT ===
        // Block ALL manual stock inflation paths
        if (reference_type === 'purchase_order') {
            if (!reference_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Reference ID (PO ID) is required for Purchase Order stock IN.'
                });
            }

            // Validate PO exists
            const po = await PurchaseOrder.findById(reference_id);
            if (!po) {
                return res.status(404).json({
                    success: false,
                    message: 'Purchase Order not found.'
                });
            }

            // Validate PO is APPROVED (not draft/pending/rejected)
            if (po.status !== 'approved') {
                return res.status(403).json({
                    success: false,
                    message: `Stock IN rejected. Purchase Order must be APPROVED (current status: ${po.status}).`
                });
            }

            // Validate material_id exists in PO items
            const poItem = po.items.find(item => item.material_id === material_id);
            if (!poItem) {
                return res.status(403).json({
                    success: false,
                    message: `Material ID ${material_id} is not included in this Purchase Order.`
                });
            }

            // Validate quantity does not exceed PO quantity
            // Check how much has already been received for this PO + material
            const { getAll } = require('../config/db');
            const received = await getAll(
                `SELECT COALESCE(SUM(quantity), 0) as total_received 
                 FROM inventory_transactions 
                 WHERE reference_type = 'purchase_order' 
                 AND reference_id = ? 
                 AND material_id = ? 
                 AND type = 'IN'`,
                [reference_id, material_id]
            );

            const totalReceived = received[0]?.total_received || 0;
            const remainingQty = poItem.quantity - totalReceived;

            if (quantity > remainingQty) {
                return res.status(403).json({
                    success: false,
                    message: `Quantity exceeds remaining PO allocation. PO quantity: ${poItem.quantity}, Already received: ${totalReceived}, Remaining: ${remainingQty}, Requested: ${quantity}`
                });
            }

        } else if (reference_type === 'adjustment') {
            // ADMIN-only adjustment path with mandatory audit
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Only ADMIN can perform inventory adjustments.'
                });
            }

            if (!notes || notes.trim().length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Inventory adjustments require detailed notes (minimum 10 characters) explaining the reason.'
                });
            }

            // Log audit for adjustment
            const auditService = require('../services/auditService');
            await auditService.log({
                user_id: req.user.id,
                action: 'ADJUSTMENT',
                entity_type: 'inventory_transaction',
                entity_id: null, // Will be filled after creation
                old_values: JSON.stringify({ stock: await Inventory.getCurrentStock(material_id, project_id) }),
                new_values: JSON.stringify({ adjustment: quantity, notes: notes }),
                ip_address: req.ip
            });

        } else {
            // BLOCK all other reference types for Stock IN
            return res.status(403).json({
                success: false,
                message: 'Invalid reference type for Stock IN. Only "purchase_order" and "adjustment" (ADMIN-only) are allowed.'
            });
        }
        // === END ENFORCEMENT ===


        const transactionId = await Inventory.createTransaction({
            material_id,
            project_id: project_id || null,
            type: 'IN',
            quantity,
            reference_type,
            reference_id,
            notes,
            usage_reason
        });

        res.status(201).json({ success: true, message: 'Stock IN recorded successfully', data: { id: transactionId } });
    } catch (error) {
        console.error('Record stock IN error:', error);
        res.status(500).json({ success: false, message: 'Failed to record stock IN' });
    }
};

// Record stock OUT
const recordStockOut = async (req, res) => {
    try {
        const { material_id, project_id, quantity, reference_type, notes, usage_reason } = req.body;

        if (!material_id || !quantity || !reference_type) {
            return res.status(400).json({ success: false, message: 'Material, quantity, and reference type are required' });
        }

        // ... (validation) ...

        // Check current stock (Global or Site specific?)
        // If we consume at a site, we check if THAT site has stock? 
        // Or if we take from global. Let's start with global check for safety, or check site if project_id provided.
        // For simplicity and to avoid blocking valid usage from central store, we check global.
        // Ideally: check Inventory.getCurrentStock(material_id, project_id) if we enforce site silos.

        const currentStock = await Inventory.getCurrentStock(material_id, project_id); // Check site stock if project_id given

        /* 
           Note: If we enforce strict site stock, outgoing from a site that received no INs will fail.
           But often materials go Central -> Site. 
           If we want "Site-wise", we should check stock AT that site.
        */

        if (currentStock < quantity) {
            // Fallback: Check global stock? No, "Site-wise" implies tracking site inventory.
            // But if user didn't migrate old data to sites, this might block. 
            // Let's stick to site check if project_id is present.

            return res.status(400).json({
                success: false,
                message: `Insufficient stock at this location. Available: ${currentStock}, Requested: ${quantity}`,
                data: { available: currentStock, requested: quantity }
            });
        }

        const transactionId = await Inventory.createTransaction({
            material_id,
            project_id,
            type: 'OUT',
            quantity,
            reference_type,
            reference_id: null,
            notes,
            usage_reason
        });

        res.status(201).json({ success: true, message: 'Stock OUT recorded successfully', data: { id: transactionId } });
    } catch (error) {
        console.error('Record stock OUT error:', error);
        res.status(500).json({ success: false, message: 'Failed to record stock OUT' });
    }
};

module.exports = {
    getStockSummary,
    getMaterialStock,
    getAllTransactions,
    getTransactionsByMaterial,
    getTransactionsByProject,
    recordStockIn,
    recordStockOut
};
