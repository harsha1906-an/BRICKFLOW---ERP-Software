const express = require('express');
const router = express.Router();
const {
    getAllPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    confirmPurchase,
    cancelPurchase,
    deletePurchase
} = require('../controllers/purchase.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAllPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.post('/:id/confirm', confirmPurchase);
router.post('/:id/cancel', cancelPurchase);
router.delete('/:id', deletePurchase);

module.exports = router;
