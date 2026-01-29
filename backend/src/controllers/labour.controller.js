const Labour = require('../models/labour.model');
const AuditService = require('../services/auditService');

// --- Labour CRUD ---
const createLabour = async (req, res) => {
    try {
        const id = await Labour.create(req.body);
        res.status(201).json({ success: true, data: { id, ...req.body } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllLabours = async (req, res) => {
    try {
        const data = await Labour.findAll();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLabourById = async (req, res) => {
    try {
        const data = await Labour.findById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Labour not found' });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateLabour = async (req, res) => {
    try {
        const oldLabour = await Labour.findById(req.params.id);

        await Labour.update(req.params.id, req.body);

        // Audit Log
        if (oldLabour) {
            await AuditService.log(
                req.user ? req.user.id : null,
                'UPDATE', 'labours', req.params.id,
                oldLabour, req.body,
                req
            );
        }

        res.json({ success: true, message: 'Labour updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteLabour = async (req, res) => {
    try {
        const oldLabour = await Labour.findById(req.params.id); // For audit

        await Labour.delete(req.params.id);

        // Audit Log
        if (oldLabour) {
            await AuditService.log(
                req.user ? req.user.id : null,
                'DELETE', 'labours', req.params.id,
                oldLabour, null,
                req
            );
        }

        res.json({ success: true, message: 'Labour deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Attendance ---
const markAttendance = async (req, res) => {
    try {
        const id = await Labour.markAttendance(req.body, req.user.id);
        res.status(201).json({ success: true, data: { id, ...req.body } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAttendance = async (req, res) => {
    try {
        const { project_id, date } = req.query;
        const data = await Labour.getAttendance(project_id, date);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const confirmAttendance = async (req, res) => {
    try {
        // Only Admin/Supervisor
        if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
            return res.status(403).json({ success: false, message: 'Only Admins or Supervisors can confirm attendance' });
        }

        const { id } = req.params;
        const { ids } = req.body; // For bulk

        if (ids && Array.isArray(ids)) {
            await Labour.confirmBulkAttendance(ids, req.user.id);
            return res.json({ success: true, message: 'Attendance records confirmed' });
        } else if (id) {
            await Labour.confirmAttendance(id, req.user.id);
            return res.json({ success: true, message: 'Attendance confirmed' });
        }

        res.status(400).json({ success: false, message: 'ID or IDs required' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Payments ---
const recordPayment = async (req, res) => {
    try {
        const { labour_id, project_id, payment_date, payment_type, base_amount, overtime_amount, bonus_amount, payment_method, notes } = req.body;

        // CRITICAL FIX #3: Duplicate payment prevention
        const existingPayments = await Labour.getPayments(labour_id);
        const duplicate = existingPayments.find(p =>
            p.labour_id === labour_id &&
            p.project_id === project_id &&
            p.payment_date === payment_date &&
            p.payment_type === payment_type
        );

        if (duplicate) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate payment detected. Payment for this labour, project, date, and type already exists.',
                existing_payment_id: duplicate.id
            });
        }

        // Skip auto-deduction for advance payments
        if (payment_type === 'advance') {
            const net_amount = base_amount + (overtime_amount || 0) + (bonus_amount || 0);
            const id = await Labour.recordPayment({
                labour_id, project_id, payment_date, payment_type,
                base_amount, overtime_amount: overtime_amount || 0,
                bonus_amount: bonus_amount || 0, deduction_amount: 0,
                net_amount, payment_method, notes,
                stage_id: req.body.stage_id
            });
            return res.status(201).json({ success: true, data: { id, net_amount, deduction_amount: 0 } });
        }

        // CRITICAL FIX #1 & #2: Auto-calculate deductions (advances + penalties)
        const totalAdvances = await Labour.getAdvanceTotal(labour_id, project_id);
        const totalPenalties = await Labour.getPenaltyTotal(labour_id, project_id);

        let deduction_amount = 0;
        const gross_amount = base_amount + (overtime_amount || 0) + (bonus_amount || 0);

        // Deduct Penalties First (Priority)
        const penaltiesToDeduct = Math.min(totalPenalties, gross_amount);
        deduction_amount += penaltiesToDeduct;

        // Deduct Advances from remaining gross
        const remainingGross = gross_amount - deduction_amount;
        const advancesToDeduct = Math.min(totalAdvances, remainingGross);
        deduction_amount += advancesToDeduct;

        // Calculate net amount
        const net_amount = gross_amount - deduction_amount;

        if (net_amount < 0) {
            return res.status(400).json({
                success: false,
                message: `Net payment cannot be negative. Gross: ₹${gross_amount}, Deductions: ₹${deduction_amount}`,
                calculation: { gross_amount, deduction_amount, totalAdvances, totalPenalties, net_amount }
            });
        }

        // Record payment
        const id = await Labour.recordPayment({
            labour_id, project_id, payment_date, payment_type,
            base_amount, overtime_amount: overtime_amount || 0,
            bonus_amount: bonus_amount || 0, deduction_amount,
            net_amount, payment_method, notes,
            stage_id: req.body.stage_id
        });

        // SAFETY: Link Attendance to Payment (Prevents double payment)
        // Auto-link all CONFIRMED & UNPAID attendance up to this payment date
        if (payment_type === 'wages' || payment_type === 'final_settlement') {
            await Labour.linkAttendanceToPayment(labour_id, project_id, payment_date, id);
        }

        // Settle Advances
        if (advancesToDeduct > 0) {
            await Labour.settleAdvances(labour_id, project_id, advancesToDeduct);
        }

        // Mark penalties as deducted
        if (penaltiesToDeduct > 0) {
            await Labour.markPenaltiesDeducted(labour_id, project_id, id);
        }

        // Audit Log
        if (req.user) {
            await AuditService.log(
                req.user.id,
                'PAYMENT', 'labour_payments', id,
                null, { labour_id, amount: net_amount, type: payment_type },
                req
            );
        }

        res.status(201).json({
            success: true,
            data: {
                id,
                gross_amount,
                deduction_amount,
                advances_deducted: totalAdvances,
                penalties_deducted: totalPenalties,
                net_amount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPayments = async (req, res) => {
    try {
        const { labour_id } = req.query;
        const data = await Labour.getPayments(labour_id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Penalties ---
const recordPenalty = async (req, res) => {
    try {
        const id = await Labour.recordPenalty(req.body);
        res.status(201).json({ success: true, data: { id, ...req.body } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPenalties = async (req, res) => {
    try {
        const { labour_id, project_id } = req.query;
        const data = await Labour.getPenalties(labour_id, project_id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Stages ---
const addStage = async (req, res) => {
    try {
        const id = await Labour.addStage(req.body);
        res.status(201).json({ success: true, data: { id, ...req.body } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getStages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const data = await Labour.getStages(projectId);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createLabour,
    getAllLabours,
    getLabourById,
    updateLabour,
    deleteLabour,
    markAttendance,
    getAttendance,
    recordPayment,
    getPayments,
    recordPenalty,
    getPenalties,
    addStage,
    getStages,
    confirmAttendance
};
