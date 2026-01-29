const Approval = require('../models/approval.model');
const PurchaseOrder = require('../models/purchaseOrder.model');

// Get generic pending approvals
const getPendingApprovals = async (req, res) => {
    try {
        const items = await Approval.getPending();
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create an approval request (Internal method usually, but exposed for "Send to Approval")
const requestApproval = async (req, res) => {
    try {
        const { entity_type, entity_id, amount, comments } = req.body;
        const userId = req.user.id;

        // 1. Create Approval Record
        await Approval.create({ entity_type, entity_id, amount, comments }, userId);

        // 2. Update Entity Status (if PO)
        if (entity_type === 'purchase_order') {
            await PurchaseOrder.updateStatus(entity_id, 'pending_approval', userId);
        }

        res.json({ success: true, message: 'Request sent for approval' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Approve/Reject
const processApproval = async (req, res) => {
    try {
        const { id } = req.params; // Approval ID
        const { status, comments, entity_type, entity_id } = req.body; // Status: 'approved' or 'rejected'
        const userId = req.user.id;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // 1. Update Approval Record
        await Approval.process(id, status, userId, comments);

        // 2. Cascade status to Entity
        if (entity_type === 'purchase_order') {
            // PO status matches approval status exactly ('approved', 'rejected')
            await PurchaseOrder.updateStatus(entity_id, status, userId);
        }

        res.json({ success: true, message: `Request ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getPendingApprovals,
    requestApproval,
    processApproval
};
