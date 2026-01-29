const Unit = require('../models/unit.model');
const Project = require('../models/project.model');

// Get all units
const getAllUnits = async (req, res) => {
    try {
        const units = await Unit.findAll();

        res.json({
            success: true,
            data: units
        });
    } catch (error) {
        console.error('Get units error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch units'
        });
    }
};

// Get units by project
const getUnitsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const units = await Unit.findByProject(projectId);

        res.json({
            success: true,
            data: units
        });
    } catch (error) {
        console.error('Get units by project error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch units'
        });
    }
};

// Get unit by ID
const getUnitById = async (req, res) => {
    try {
        const { id } = req.params;
        const unit = await Unit.findById(id);

        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
        }

        res.json({
            success: true,
            data: unit
        });
    } catch (error) {
        console.error('Get unit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unit'
        });
    }
};

// Create unit
const createUnit = async (req, res) => {
    try {
        const { project_id, unit_number, type, price, status } = req.body;

        // Validation
        if (!project_id || !unit_number || !type || !price || !status) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if project exists
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Validate type
        if (!['3BHK', '4BHK'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid type. Must be: 3BHK or 4BHK'
            });
        }

        // Validate status
        if (!['available', 'booked', 'sold'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: available, booked, or sold'
            });
        }

        // Validate price
        if (price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be greater than 0'
            });
        }

        const unitId = await Unit.create({ project_id, unit_number, type, price, status });

        res.status(201).json({
            success: true,
            message: 'Unit created successfully',
            data: { id: unitId }
        });
    } catch (error) {
        console.error('Create unit error:', error);

        // Handle unique constraint violation
        if (error.message && error.message.includes('UNIQUE')) {
            return res.status(400).json({
                success: false,
                message: 'Unit number already exists in this project'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create unit'
        });
    }
};

// Update unit
const updateUnit = async (req, res) => {
    try {
        const { id } = req.params;
        const { unit_number, type, price, status } = req.body;

        // Check if unit exists
        const unit = await Unit.findById(id);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
        }

        // Validation
        if (!unit_number || !type || !price || !status) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate type
        if (!['3BHK', '4BHK'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid type. Must be: 3BHK or 4BHK'
            });
        }

        // Validate status
        if (!['available', 'booked', 'sold'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: available, booked, or sold'
            });
        }

        // Validate price
        if (price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be greater than 0'
            });
        }

        await Unit.update(id, { unit_number, type, price, status });

        res.json({
            success: true,
            message: 'Unit updated successfully'
        });
    } catch (error) {
        console.error('Update unit error:', error);

        // Handle unique constraint violation
        if (error.message && error.message.includes('UNIQUE')) {
            return res.status(400).json({
                success: false,
                message: 'Unit number already exists in this project'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update unit'
        });
    }
};

// Delete unit
const deleteUnit = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if unit exists
        const unit = await Unit.findById(id);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
        }

        await Unit.delete(id);

        res.json({
            success: true,
            message: 'Unit deleted successfully'
        });
    } catch (error) {
        console.error('Delete unit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete unit'
        });
    }
};

module.exports = {
    getAllUnits,
    getUnitsByProject,
    getUnitById,
    createUnit,
    updateUnit,
    deleteUnit
};
