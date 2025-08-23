import express from 'express';
import { auth } from '../../middlewares/authMiddleware';
import { getHelpCenter, updateHelpCenter } from './help-center.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Help Center
 *     description: Manage Help Center content
 */

/**
 * @swagger
 * /v1/api/help-center:
 *   get:
 *     summary: Get Help Center content
 *     description: Returns the current Help Center content. Creates a default one if none exists.
 *     tags: [Help Center]
 *     responses:
 *       200:
 *         description: Help Center retrieved successfully
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
 *                   $ref: '#/components/schemas/HelpCenter'
 */
router.get('/', getHelpCenter);

/**
 * @swagger
 * /v1/api/help-center:
 *   put:
 *     summary: Update Help Center content
 *     description: Update the Help Center content. Admin only.
 *     tags: [Help Center]
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
 *         description: Help Center updated successfully
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
 *                   $ref: '#/components/schemas/HelpCenter'
 */
router.put('/', auth('admin'), updateHelpCenter);

export const helpCenterRouter = router;
