const express = require('express');
const router = express.Router();
const {
    getAllUnits,
    getUnitsByProject,
    getUnitById,
    createUnit,
    updateUnit,
    deleteUnit
} = require('../controllers/unit.controller');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes are protected
router.use(authMiddleware);

// GET /api/units - Get all units
router.get('/', getAllUnits);

// GET /api/units/project/:projectId - Get units by project
router.get('/project/:projectId', getUnitsByProject);

// GET /api/units/:id - Get unit by ID
router.get('/:id', getUnitById);

// POST /api/units - Create new unit
router.post('/', createUnit);

// PUT /api/units/:id - Update unit (ADMIN-only for price changes)
// CRITICAL PHASE 4: ADMIN-only for unit price edits
router.put('/:id', roleCheck(['ADMIN']), updateUnit);

// DELETE /api/units/:id - Delete unit
router.delete('/:id', roleCheck(['ADMIN']), deleteUnit);

module.exports = router;
