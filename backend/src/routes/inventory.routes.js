const express = require('express');
const router = express.Router();
const {
    getStockSummary,
    getMaterialStock,
    getAllTransactions,
    getTransactionsByMaterial,
    getTransactionsByProject,
    recordStockIn,
    recordStockOut
} = require('../controllers/inventory.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Stock queries
router.get('/stock', getStockSummary);
router.get('/stock/:materialId', getMaterialStock);

// Transactions
router.get('/transactions', getAllTransactions);
router.get('/transactions/material/:materialId', getTransactionsByMaterial);
router.get('/transactions/project/:projectId', getTransactionsByProject);

// Stock movements
router.post('/in', recordStockIn);
router.post('/out', recordStockOut);

module.exports = router;
