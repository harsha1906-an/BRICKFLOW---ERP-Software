const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approval.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/pending', approvalController.getPendingApprovals);
router.post('/request', approvalController.requestApproval);
router.put('/:id', approvalController.processApproval);

module.exports = router;
