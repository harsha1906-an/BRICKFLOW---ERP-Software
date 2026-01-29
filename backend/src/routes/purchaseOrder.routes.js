const express = require('express');
const router = express.Router();
const poController = require('../controllers/purchaseOrder.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', poController.getAllPOs);
router.get('/:id', poController.getPOById);
router.get('/:id/pdf', poController.downloadPdf);
router.post('/', poController.createPO);
router.put('/:id/status', poController.updatePOStatus);

module.exports = router;
