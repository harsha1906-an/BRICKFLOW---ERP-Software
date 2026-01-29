const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate, schemas } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');
const protect = require('../middleware/auth'); // Correct import (default export)

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and management
 */

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Relaxed for testing
    message: { success: false, message: 'Too many login attempts, please try again later.' }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manager, supervisor, staff, owner, accounts]
 *     responses:
 *       201:
 *         description: User registered successfully
 */
// POST /api/auth/register - Register endpoint
router.post('/register', validate(schemas.user), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 */
// POST /api/auth/login - Login endpoint
router.post('/login', authLimiter, validate(schemas.login), authController.login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', protect, authController.getCurrentUser);

module.exports = router;
