const Material = require('../models/material.model');

// Get all materials
const getAllMaterials = async (req, res) => {
    try {
        const materials = await Material.findAll();
        res.json({ success: true, data: materials });
    } catch (error) {
        console.error('Get materials error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch materials' });
    }
};

// Get material by ID
const getMaterialById = async (req, res) => {
    try {
        const { id } = req.params;
        const material = await Material.findById(id);

        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        res.json({ success: true, data: material });
    } catch (error) {
        console.error('Get material error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch material' });
    }
};

// Create material
const createMaterial = async (req, res) => {
    try {
        const { name, unit } = req.body;

        if (!name || !unit) {
            return res.status(400).json({ success: false, message: 'Name and unit are required' });
        }

        const materialId = await Material.create({ name, unit });
        res.status(201).json({ success: true, message: 'Material created successfully', data: { id: materialId } });
    } catch (error) {
        console.error('Create material error:', error);
        if (error.message && error.message.includes('UNIQUE')) {
            return res.status(400).json({ success: false, message: 'Material name already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to create material' });
    }
};

// Update material
const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, unit } = req.body;

        const material = await Material.findById(id);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        if (!name || !unit) {
            return res.status(400).json({ success: false, message: 'Name and unit are required' });
        }

        await Material.update(id, { name, unit });
        res.json({ success: true, message: 'Material updated successfully' });
    } catch (error) {
        console.error('Update material error:', error);
        if (error.message && error.message.includes('UNIQUE')) {
            return res.status(400).json({ success: false, message: 'Material name already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to update material' });
    }
};

// Delete material
const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        const material = await Material.findById(id);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        const hasTransactions = await Material.hasTransactions(id);
        if (hasTransactions) {
            return res.status(400).json({ success: false, message: 'Cannot delete material with transaction history' });
        }

        await Material.delete(id);
        res.json({ success: true, message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Delete material error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete material' });
    }
};

module.exports = {
    getAllMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
};
