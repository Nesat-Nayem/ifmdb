"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.advertiseRouter = void 0;
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const cloudinary_1 = require("../../config/cloudinary");
const advertise_controller_1 = require("./advertise.controller");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Advertisements
 *     description: Manage advertisements
 */
/**
 * @swagger
 * /v1/api/advertisements:
 *   post:
 *     summary: Create a new advertisement
 *     description: Creates an advertisement with image (required) and status (active|inactive, default active). Admin only.
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               image:
 *                 type: string
 *                 format: binary
 *             required: [image]
 *     responses:
 *       201:
 *         description: Advertisement created successfully
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
 *                   $ref: '#/components/schemas/Advertise'
 *       400:
 *         description: Validation error or missing image
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', (0, authMiddleware_1.auth)('admin'), cloudinary_1.upload.single('image'), advertise_controller_1.createAdvertise);
/**
 * @swagger
 * /v1/api/advertisements:
 *   get:
 *     summary: Get all advertisements
 *     tags: [Advertisements]
 *     responses:
 *       200:
 *         description: Advertisements retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Advertise'
 */
router.get('/', advertise_controller_1.getAllAdvertisements);
/**
 * @swagger
 * /v1/api/advertisements/{id}:
 *   get:
 *     summary: Get an advertisement by ID
 *     tags: [Advertisements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *     responses:
 *       200:
 *         description: Advertisement retrieved successfully
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
 *                   $ref: '#/components/schemas/Advertise'
 *       404:
 *         description: Advertisement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', advertise_controller_1.getAdvertiseById);
/**
 * @swagger
 * /v1/api/advertisements/{id}:
 *   put:
 *     summary: Update an advertisement by ID
 *     description: Updates status and/or replaces the image. Admin only.
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Advertisement updated successfully
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
 *                   $ref: '#/components/schemas/Advertise'
 *       404:
 *         description: Advertisement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', (0, authMiddleware_1.auth)('admin'), cloudinary_1.upload.single('image'), advertise_controller_1.updateAdvertiseById);
/**
 * @swagger
 * /v1/api/advertisements/{id}:
 *   delete:
 *     summary: Delete an advertisement by ID (soft delete)
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *     responses:
 *       200:
 *         description: Advertisement deleted successfully
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
 *                   $ref: '#/components/schemas/Advertise'
 *       404:
 *         description: Advertisement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', (0, authMiddleware_1.auth)('admin'), advertise_controller_1.deleteAdvertiseById);
exports.advertiseRouter = router;
