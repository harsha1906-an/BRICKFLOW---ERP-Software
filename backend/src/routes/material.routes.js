const express = require('express');
const router = express.Router();
const {
    getAllMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
} = require('../controllers/material.controller');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(authMiddleware);

router.get('/', getAllMaterials);
router.get('/:id', getMaterialById);
router.post('/', createMaterial);
// CRITICAL PHASE 4: ADMIN-only for material rate edits
router.put('/:id', roleCheck(['ADMIN']), updateMaterial);
router.delete('/:id', roleCheck(['ADMIN']), deleteMaterial);

module.exports = router;
