import express from 'express';
import { auth } from '../../middlewares/authMiddleware';
import { getGeneralSettings, updateGeneralSettings } from './general-settings.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: General Settings
 *     description: Manage site-wide general settings
 */

/**
 * @swagger
 * /v1/api/general-settings:
 *   get:
 *     summary: Get general settings
 *     tags: [General Settings]
 *     responses:
 *       200:
 *         description: General settings retrieved successfully
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
 *                   $ref: '#/components/schemas/GeneralSettings'
 */
router.get('/', getGeneralSettings);

/**
 * @swagger
 * /v1/api/general-settings:
 *   put:
 *     summary: Update general settings
 *     description: Admin only. Provide any of the settings fields to update.
 *     tags: [General Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneralSettingsUpdate'
 *     responses:
 *       200:
 *         description: General settings updated successfully
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
 *                   $ref: '#/components/schemas/GeneralSettings'
 */
router.put('/', auth('admin'), updateGeneralSettings);

export const generalSettingsRouter = router;
