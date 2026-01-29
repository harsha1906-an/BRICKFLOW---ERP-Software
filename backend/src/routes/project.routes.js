const express = require('express');
const router = express.Router();
const {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/project.controller');
const authMiddleware = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

// GET /api/projects - Get all projects
router.get('/', getAllProjects);

// GET /api/projects/:id - Get project by ID
router.get('/:id', getProjectById);

// POST /api/projects - Create new project
router.post('/', createProject);

// PUT /api/projects/:id - Update project
router.put('/:id', updateProject);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', deleteProject);

module.exports = router;
