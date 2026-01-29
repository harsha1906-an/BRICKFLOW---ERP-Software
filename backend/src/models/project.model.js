const { getAll, getOne, runQuery } = require('../config/db');

const Project = {
    // Get all projects with pagination
    findAll: async (limit = 50, offset = 0) => {
        try {
            const projects = await getAll('SELECT * FROM projects WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
            const countResult = await getOne('SELECT COUNT(*) as count FROM projects WHERE is_active = 1');
            return {
                projects,
                total: countResult.count
            };
        } catch (error) {
            throw error;
        }
    },

    // Get project by ID
    findById: async (id) => {
        try {
            const project = await getOne('SELECT * FROM projects WHERE id = ? AND is_active = 1', [id]);
            return project;
        } catch (error) {
            throw error;
        }
    },

    // Create new project
    create: async (data) => {
        try {
            const { name, location, start_date, status } = data;
            const result = await runQuery(
                'INSERT INTO projects (name, location, start_date, status) VALUES (?, ?, ?, ?)',
                [name, location, start_date, status]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Update project
    update: async (id, data) => {
        try {
            const { name, location, start_date, status } = data;
            await runQuery(
                'UPDATE projects SET name = ?, location = ?, start_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, location, start_date, status, id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Delete project
    delete: async (id) => {
        try {
            await runQuery('UPDATE projects SET is_active = 0 WHERE id = ?', [id]);
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Check if project has units
    hasUnits: async (id) => {
        try {
            const result = await getOne('SELECT COUNT(*) as count FROM units WHERE project_id = ? AND is_active = 1', [id]);
            return result.count > 0;
        } catch (error) {
            throw error;
        }
    },

    // Get unit count for project
    getUnitCount: async (id) => {
        try {
            const result = await getOne('SELECT COUNT(*) as count FROM units WHERE project_id = ?', [id]);
            return result.count;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Project;
