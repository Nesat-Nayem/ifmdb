import express from 'express';
import { getPrivacyPolicy, updatePrivacyPolicy } from './privacy-policy.controller';
import { auth } from '../../middlewares/authMiddleware';
import { adminMiddleware } from '../../middlewares/adminMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Privacy Policy
 *     description: Manage privacy policy document
 */

/**
 * @swagger
 * /v1/api/privacy-policy:
 *   get:
 *     summary: Get privacy policy
 *     description: Returns the current privacy policy. Creates a default one if none exists.
 *     tags: [Privacy Policy]
 *     responses:
 *       200:
 *         description: Privacy policy retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PrivacyPolicy'
 */
// Get privacy policy (public)
router.get('/', getPrivacyPolicy);

/**
 * @swagger
 * /v1/api/privacy-policy:
 *   put:
 *     summary: Update privacy policy
 *     description: Update the privacy policy content. Admin only.
 *     tags: [Privacy Policy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: HTML or markdown content
 *             required: [content]
 *     responses:
 *       200:
 *         description: Privacy policy updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PrivacyPolicy'
 */
// Update privacy policy (admin only)
router.put('/', auth('admin'), updatePrivacyPolicy);

export const privacyPolicyRouter = router;