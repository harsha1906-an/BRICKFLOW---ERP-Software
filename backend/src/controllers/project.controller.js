const Project = require('../models/project.model');
const AuditService = require('../services/auditService');

// Get all projects
const getAllProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { projects, total } = await Project.findAll(limit, offset);

        // Add unit count to each project
        const projectsWithCounts = await Promise.all(
            projects.map(async (project) => {
                const unitCount = await Project.getUnitCount(project.id);
                return { ...project, unit_count: unitCount };
            })
        );

        res.json({
            success: true,
            data: projectsWithCounts,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: limit
            }
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects'
        });
    }
};

// Get project by ID
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const unitCount = await Project.getUnitCount(id);

        res.json({
            success: true,
            data: { ...project, unit_count: unitCount }
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project'
        });
    }
};

// Create project
const createProject = async (req, res) => {
    try {
        const { name, location, start_date, status } = req.body;

        // Validation
        if (!name || !location || !start_date || !status) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!['planning', 'ongoing', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: planning, ongoing, or completed'
            });
        }

        const projectId = await Project.create({ name, location, start_date, status });

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: { id: projectId }
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create project'
        });
    }
};

// Update project
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, start_date, status } = req.body;

        // Check if project exists
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Validation
        if (!name || !location || !start_date || !status) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!['planning', 'ongoing', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: planning, ongoing, or completed'
            });
        }

        const oldProject = { ...project }; // Clone for audit
        await Project.update(id, { name, location, start_date, status });

        // Audit Log
        await AuditService.log(
            req.user ? req.user.id : null,
            'UPDATE', 'projects', id,
            oldProject, { name, location, start_date, status },
            req
        );

        res.json({
            success: true,
            message: 'Project updated successfully'
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update project'
        });
    }
};

// Delete project
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if project exists
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if project has units
        const hasUnits = await Project.hasUnits(id);
        if (hasUnits) {
            const unitCount = await Project.getUnitCount(id);
            return res.status(400).json({
                success: false,
                message: `Cannot delete project. It has ${unitCount} unit(s). Please delete all units first.`
            });
        }

        await Project.delete(id);

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete project'
        });
    }
};

module.exports = {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
