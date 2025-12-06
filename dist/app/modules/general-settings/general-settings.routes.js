"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalSettingsRouter = void 0;
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const general_settings_controller_1 = require("./general-settings.controller");
const cloudinary_1 = require("../../config/cloudinary");
const router = express_1.default.Router();
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
router.get('/', general_settings_controller_1.getGeneralSettings);
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
router.put('/', (0, authMiddleware_1.auth)('admin'), cloudinary_1.upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
]), general_settings_controller_1.updateGeneralSettings);
exports.generalSettingsRouter = router;
