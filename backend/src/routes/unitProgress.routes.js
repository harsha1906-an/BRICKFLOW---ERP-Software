const express = require('express');
const router = express.Router();
const {
    getConstructionStages,
    getUnitProgress,
    getProjectProgress,
    updateProgress,
    initializeUnitProgress
} = require('../controllers/unitProgress.controller');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Construction stages (master data)
router.get('/stages', getConstructionStages);

// Unit progress
router.get('/unit/:unitId', getUnitProgress);
router.post('/unit/:unitId/initialize', initializeUnitProgress);
router.put('/unit/:unitId/stage/:stageId', updateProgress);

// Project-level progress
router.get('/project/:projectId', getProjectProgress);

module.exports = router;
