const bcrypt = require('bcrypt');
const { getOne, getAll } = require('../config/db');

const User = {
    // Find user by username
    findByUsername: async (username) => {
        try {
            const user = await getOne(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            return user;
        } catch (error) {
            throw error;
        }
    },

    // Find user by ID
    findById: async (id) => {
        try {
            const user = await getOne(
                'SELECT id, name, username, role, is_active FROM users WHERE id = ?',
                [id]
            );
            return user;
        } catch (error) {
            throw error;
        }
    },

    // Find users by role
    findByRole: async (role) => {
        try {
            const users = await getAll(
                'SELECT id, name, username, role FROM users WHERE role = ? AND is_active = 1',
                [role]
            );
            return users;
        } catch (error) {
            throw error;
        }
    },

    // Find users by multiple roles
    findByRoles: async (roles) => {
        try {
            const placeholders = roles.map(() => '?').join(',');
            const users = await getAll(
                `SELECT id, name, username, role FROM users WHERE role IN (${placeholders}) AND is_active = 1`,
                roles
            );
            return users;
        } catch (error) {
            throw error;
        }
    },

    // Compare password
    comparePassword: async (plainPassword, hashedPassword) => {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            throw error;
        }
    },

    // Hash password
    hashPassword: async (password) => {
        try {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            throw error;
        }
    }
};

module.exports = User;
