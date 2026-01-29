const express = require('express');
const router = express.Router();
const labourController = require('../controllers/labour.controller');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateRequired, validateNumber } = require('../middleware/validators');

router.use(authMiddleware);

// Labour Management
router.post('/', validateRequired(['name', 'type', 'daily_wage']), validateNumber('daily_wage'), labourController.createLabour);
router.get('/', labourController.getAllLabours);
router.get('/:id', labourController.getLabourById);
// CRITICAL PHASE 4: ADMIN-only for labour wage edits
router.put('/:id', roleCheck(['ADMIN']), labourController.updateLabour);
router.delete('/:id', roleCheck(['ADMIN']), labourController.deleteLabour);

// Attendance
router.post('/attendance', validateRequired(['labour_id', 'project_id', 'attendance_date', 'status']), labourController.markAttendance);
router.post('/attendance/confirm/:id', labourController.confirmAttendance); // Single
router.post('/attendance/confirm', labourController.confirmAttendance); // Bulk (body.ids)
router.get('/attendance', labourController.getAttendance);

// Payments
router.post('/payments', validateRequired(['labour_id', 'project_id', 'amount', 'payment_date']), labourController.recordPayment);
router.get('/payments', labourController.getPayments);

// Penalties
router.post('/penalties', validateRequired(['labour_id', 'project_id', 'penalty_date', 'penalty_type', 'amount', 'reason']), labourController.recordPenalty);
router.get('/penalties', labourController.getPenalties);

// Project Stages
router.post('/stages', validateRequired(['project_id', 'stage_name', 'payment_percentage']), labourController.addStage);
router.get('/stages/:projectId', labourController.getStages);

module.exports = router;
