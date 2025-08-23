"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpCenterRouter = void 0;
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const help_center_controller_1 = require("./help-center.controller");
const router = express_1.default.Router();
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
router.get('/', help_center_controller_1.getHelpCenter);
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
router.put('/', (0, authMiddleware_1.auth)('admin'), help_center_controller_1.updateHelpCenter);
exports.helpCenterRouter = router;
