const PurchaseOrder = require('../models/purchaseOrder.model');
const { generatePurchaseOrderPDF } = require('../services/pdfService');
const AuditService = require('../services/auditService');

const getAllPOs = async (req, res) => {
    try {
        const pos = await PurchaseOrder.findAll();
        res.json({ success: true, data: pos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPOById = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
        res.json({ success: true, data: po });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createPO = async (req, res) => {
    try {
        const userId = req.user.id;
        const poId = await PurchaseOrder.create(req.body, userId);
        res.status(201).json({ success: true, data: { id: poId, message: 'PO created successfully' } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updatePOStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const oldPO = await PurchaseOrder.findById(req.params.id);

        await PurchaseOrder.updateStatus(req.params.id, status, req.user.id);

        // Audit Log
        if (oldPO) {
            await AuditService.log(
                req.user ? req.user.id : null,
                'STATUS_CHANGE', 'purchase_orders', req.params.id,
                { status: oldPO.status }, { status },
                req
            );
        }

        res.json({ success: true, message: `PO status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const downloadPdf = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) {
            return res.status(404).json({ success: false, message: 'Purchase Order not found' });
        }

        // Generate and stream PDF
        generatePurchaseOrderPDF(po, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllPOs,
    getPOById,
    createPO,
    updatePOStatus,
    downloadPdf
};
