const UnitProgress = require('../models/unitProgress.model');
const ConstructionStage = require('../models/constructionStage.model');
const AuditService = require('../services/auditService');

// Get all construction stages
const getConstructionStages = async (req, res) => {
    try {
        const stages = await ConstructionStage.findAll();
        res.json({ success: true, data: stages });
    } catch (error) {
        console.error('Get construction stages error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch construction stages' });
    }
};

// Get progress for a specific unit
const getUnitProgress = async (req, res) => {
    try {
        const { unitId } = req.params;
        const progress = await UnitProgress.getUnitProgress(parseInt(unitId));
        res.json({ success: true, data: progress });
    } catch (error) {
        console.error('Get unit progress error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unit progress' });
    }
};

// Get progress for all units in a project
const getProjectProgress = async (req, res) => {
    try {
        const { projectId } = req.params;
        const progress = await UnitProgress.getProjectProgress(parseInt(projectId));
        res.json({ success: true, data: progress });
    } catch (error) {
        console.error('Get project progress error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch project progress' });
    }
};

const updateProgress = async (req, res) => {
    try {
        const { unitId, stageId } = req.params;
        const { status, remarks } = req.body;

        // Validate status
        if (!['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be NOT_STARTED, IN_PROGRESS, or COMPLETED'
            });
        }

        // Role-based access control
        console.log('DEBUG: req.user:', req.user);
        // Normalize role to lowercase for comparison
        const userRole = req.user.role ? req.user.role.toLowerCase() : '';
        if (status === 'COMPLETED' && !['admin', 'supervisor'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Only Admin or Supervisor can mark stages as COMPLETED. Your role: ${req.user.role}`
            });
        }

        // Update status
        const result = await UnitProgress.updateStatus(
            parseInt(unitId),
            parseInt(stageId),
            status,
            req.user.id,
            remarks
        );

        // Audit log for status changes
        await AuditService.log(
            req.user.id,
            status === 'COMPLETED' ? 'PROGRESS_COMPLETION' : 'PROGRESS_STATUS_CHANGE',
            'unit_progress',
            `${unitId}-${stageId}`,
            { status: result.old_status },
            { status: result.new_status, verified_by: status === 'COMPLETED' ? req.user.id : null },
            req
        );

        // === CRITICAL PHASE 3: AUTO PAYMENT REQUEST TRIGGER ===
        if (status === 'COMPLETED') {
            try {
                const { getOne, runQuery } = require('../config/db');
                const PaymentRequest = require('../models/paymentRequest.model');
                const notificationService = require('../services/notificationService');

                // 1. Check if unit has an active booking
                const booking = await getOne(
                    `SELECT b.*, c.id as customer_id, c.name as customer_name, c.phone as customer_phone 
                     FROM bookings b 
                     JOIN customers c ON b.customer_id = c.id 
                     WHERE b.unit_id = ? AND b.status IN ('booked', 'confirmed')
                     ORDER BY b.created_at DESC LIMIT 1`,
                    [unitId]
                );

                if (!booking) {
                    console.log(`No active booking found for unit ${unitId}, skipping payment request creation.`);
                } else {
                    // 2. Check if payment request already exists for this booking + stage combination
                    // We use notes field to track the stage_id since there's no direct stage_id column
                    const existingRequest = await getOne(
                        `SELECT id FROM payment_requests 
                         WHERE booking_id = ? AND notes LIKE ?`,
                        [booking.id, `%stage_id:${stageId}%`]
                    );

                    if (existingRequest) {
                        console.log(`Payment request already exists for booking ${booking.id} and stage ${stageId}.`);
                    } else {
                        // 3. Calculate payment amount (example: 10% of agreed price per stage, adjust as needed)
                        // In real system, this would come from payment_schedule or milestone configuration
                        const { getAll } = require('../config/db');
                        const totalStages = await getAll('SELECT COUNT(*) as count FROM construction_stages');
                        const stageCount = totalStages[0]?.count || 10;

                        // Simple logic: divide total price by number of stages
                        const amountPerStage = booking.agreed_price / stageCount;

                        // 4. Create payment request
                        const paymentRequestId = await PaymentRequest.create({
                            booking_id: booking.id,
                            customer_id: booking.customer_id,
                            amount_requested: Math.round(amountPerStage),
                            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
                            request_date: new Date().toISOString().split('T')[0],
                            notes: `Auto-generated from unit progress completion. Unit: ${unitId}, Stage: ${stageId}, stage_id:${stageId}`,
                            created_by: req.user.id
                        });

                        // 5. Audit log for auto-creation
                        await AuditService.log(
                            req.user.id,
                            'AUTO_CREATE_PAYMENT_REQUEST',
                            'payment_requests',
                            paymentRequestId,
                            null,
                            { booking_id: booking.id, stage_id: stageId, amount: amountPerStage },
                            req
                        );

                        // 6. Send notification to customer
                        try {
                            await notificationService.sendPaymentRequest(booking.customer_id, paymentRequestId);
                            console.log(`Payment request notification sent to customer ${booking.customer_name}`);
                        } catch (notificationError) {
                            console.error('Failed to send payment request notification:', notificationError.message);
                            // Don't fail the main request if notification fails
                        }

                        console.log(`✅ Auto-created payment request ID ${paymentRequestId} for booking ${booking.id} (Stage ${stageId} completed)`);
                    }
                }
            } catch (autoCreateError) {
                console.error('Error in auto payment request creation:', autoCreateError);
                // Log but don't fail the main progress update
                await AuditService.log(
                    req.user.id,
                    'AUTO_CREATE_PAYMENT_REQUEST_FAILED',
                    'unit_progress',
                    `${unitId}-${stageId}`,
                    null,
                    { error: autoCreateError.message },
                    req
                );
            }
        }
        // === END AUTO TRIGGER ===

        res.json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};


// Initialize progress for a unit (typically called when unit is created)
const initializeUnitProgress = async (req, res) => {
    try {
        const { unitId } = req.params;
        const result = await UnitProgress.initializeUnitProgress(parseInt(unitId));
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Initialize unit progress error:', error);
        res.status(500).json({ success: false, message: 'Failed to initialize unit progress', error: error.message });
    }
};

module.exports = {
    getConstructionStages,
    getUnitProgress,
    getProjectProgress,
    updateProgress,
    initializeUnitProgress
};
