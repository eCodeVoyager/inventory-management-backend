const express = require('express');
const passport = require('passport');
const userController = require('../controllers/userController');
const authMiddleware = require('../../../middleware/authMiddleware');
const { validateRequest } = require('../validations/userValidation');
const { updateUserSchema } = require('../validations/userValidation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/v1/user/google:
 *   get:
 *     tags: [Authentication]
 *     summary: Initiate Google OAuth authentication
 *     description: Redirects user to Google OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

/**
 * @swagger
 * /api/v1/user/google/callback:
 *   get:
 *     tags: [Authentication]
 *     summary: Handle Google OAuth callback
 *     description: Processes Google OAuth callback and returns JWT token
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for security
 *     responses:
 *       302:
 *         description: Redirect to frontend with token or error
 *       400:
 *         description: OAuth authentication failed
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=auth_failed`
  }),
  userController.googleCallback
);

/**
 * @swagger
 * /api/v1/user/verify:
 *   get:
 *     tags: [Authentication]
 *     summary: Verify JWT token
 *     description: Verifies the provided JWT token and returns user information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "Token verified successfully"
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// JWT token verification route
router.get('/verify', userController.verifyToken);

// Protected routes (require authentication)
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/user/profile:
 *   get:
 *     tags: [User Profile]
 *     summary: Get current user profile
 *     description: Retrieves the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "User profile retrieved successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get current user profile
router.get('/profile', userController.getCurrentUser);

/**
 * @swagger
 * /api/v1/user/profile:
 *   put:
 *     tags: [User Profile]
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *                 description: URL to user's profile picture
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Update user profile
router.put('/profile', 
  validateRequest(updateUserSchema),
  userController.updateUser
);

/**
 * @swagger
 * /api/v1/user/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Logs out the authenticated user (client-side token cleanup)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Logout route (client-side token cleanup)
router.post('/logout', userController.logout);

module.exports = router;