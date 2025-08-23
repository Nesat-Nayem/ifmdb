"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyPolicyRouter = void 0;
const express_1 = __importDefault(require("express"));
const privacy_policy_controller_1 = require("./privacy-policy.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
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
router.get('/', privacy_policy_controller_1.getPrivacyPolicy);
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
router.put('/', (0, authMiddleware_1.auth)('admin'), privacy_policy_controller_1.updatePrivacyPolicy);
exports.privacyPolicyRouter = router;
