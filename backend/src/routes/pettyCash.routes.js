const express = require('express');
const router = express.Router();
const pettyCashController = require('../controllers/pettyCash.controller');
const authenticate = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Record transaction
router.post('/', pettyCashController.recordTransaction);

// Get transactions for a project
router.get('/project/:projectId', pettyCashController.getProjectTransactions);

// Get balance for a project
router.get('/balance/:projectId', pettyCashController.getBalance);

// Replenish cash
router.post('/replenish', pettyCashController.replenishCash);

// Get summary
router.get('/summary/:projectId', pettyCashController.getSummary);

module.exports = router;
