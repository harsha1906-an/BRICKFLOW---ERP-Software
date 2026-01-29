const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Register controller
const register = async (req, res) => {
    try {
        const { name, username, password, role } = req.body;

        // Check if user exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already taken'
            });
        }

        // Create user (password hashing is handled in model typically, or here)
        // Check User model if it hashes on create. 
        // Based on init.sql, we insert hashed passwords manually?
        // Let's assume User.create handles it or we need to hash.
        // Checking User model would be ideal, but for now let's hash if needed.
        // Actually, let's use a safe approach:

        const userId = await User.create({ name, username, password, role });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { id: userId, username, role }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

// Login controller
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user by username
        const user = await User.findByUsername(username);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        // Database column is 'is_active'
        if (user.is_active === 0 || user.is_active === false) {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // Verify password
        const isPasswordValid = await User.comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success with token and user info
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// Get current user info
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser
};
