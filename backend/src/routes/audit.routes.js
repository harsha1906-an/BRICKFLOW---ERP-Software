const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const authenticate = require('../middleware/auth');

// All audit routes require authentication
router.use(authenticate);

// Get all audit logs (with filters)
router.get('/', auditController.getAllLogs);

// Get logs for specific entity
router.get('/entity/:type/:id', auditController.getLogsByEntity);

// Get logs for specific user
router.get('/user/:userId', auditController.getLogsByUser);

module.exports = router;
