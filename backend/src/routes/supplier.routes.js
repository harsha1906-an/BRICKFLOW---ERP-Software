const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', supplierController.getSuppliers);

module.exports = router;
