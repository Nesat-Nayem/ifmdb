"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingRouter = void 0;
const express_1 = __importDefault(require("express"));
const onboarding_controller_1 = require("./onboarding.controller");
const cloudinary_1 = require("../../config/cloudinary");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Onboarding:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: '66c8b3f9e9b1c5a7d7654321'
 *         title:
 *           type: string
 *           example: 'Welcome to IFMDB'
 *         subtitle:
 *           type: string
 *           example: 'Discover movies, events, and more'
 *         image:
 *           type: string
 *           description: Banner image URL
 *           example: 'https://res.cloudinary.com/demo/image/upload/v1724301123/ifmdb/onboarding/welcome.jpg'
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: 'active'
 *         metaTitle:
 *           type: string
 *           example: 'IFMDB - Welcome'
 *         metaTags:
 *           type: array
 *           items:
 *             type: string
 *           example: ['movies', 'events', 'tickets']
 *         metaDescription:
 *           type: string
 *           example: 'Explore the latest movies, events, and exclusive offers on IFMDB.'
 *         isDeleted:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           example: '8/22/2025, 10:05:00 AM'
 *         updatedAt:
 *           type: string
 *           example: '8/22/2025, 10:06:30 AM'
 */
/**
 * @swagger
 * tags:
 *   - name: Onboarding
 *     description: Manage onboarding screens/banners
 */
/**
 * @swagger
 * /v1/api/onboarding:
 *   post:
 *     summary: Create onboarding item
 *     description: Create an onboarding item with image upload. Admin only.
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *                 example: 'Welcome to IFMDB'
 *               subtitle:
 *                 type: string
 *                 example: 'Discover movies, events, and more'
 *               image:
 *                 type: string
 *                 format: binary
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: 'active'
 *               metaTitle:
 *                 type: string
 *                 example: 'IFMDB - Welcome'
 *               metaTags:
 *                 type: string
 *                 description: Comma separated tags
 *                 example: 'movies, events, tickets'
 *               metaDescription:
 *                 type: string
 *                 example: 'Explore the latest movies, events, and exclusive offers on IFMDB.'
 *     responses:
 *       201:
 *         description: Onboarding created successfully
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
 *                   $ref: '#/components/schemas/Onboarding'
 */
router.post('/', (0, authMiddleware_1.auth)('admin'), cloudinary_1.upload.single('image'), onboarding_controller_1.createOnboarding);
/**
 * @swagger
 * /v1/api/onboarding:
 *   get:
 *     summary: Get all onboarding items
 *     tags: [Onboarding]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         example: 'active'
 *     responses:
 *       200:
 *         description: Onboarding list
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
 *                     $ref: '#/components/schemas/Onboarding'
 */
router.get('/', onboarding_controller_1.getAllOnboarding);
/**
 * @swagger
 * /v1/api/onboarding/{id}:
 *   get:
 *     summary: Get onboarding item by ID
 *     tags: [Onboarding]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Onboarding item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Onboarding'
 */
router.get('/:id', onboarding_controller_1.getOnboardingById);
/**
 * @swagger
 * /v1/api/onboarding/{id}:
 *   put:
 *     summary: Update onboarding item
 *     description: Update fields or replace image. Admin only.
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: 'Get Ready For New Releases'
 *               subtitle:
 *                 type: string
 *                 example: 'Trailers, cast, and showtimes'
 *               image:
 *                 type: string
 *                 format: binary
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: 'inactive'
 *               metaTitle:
 *                 type: string
 *                 example: 'IFMDB - New Releases'
 *               metaTags:
 *                 type: string
 *                 example: 'trailers, cast, showtimes'
 *               metaDescription:
 *                 type: string
 *                 example: 'Stay updated with the newest releases on IFMDB.'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Onboarding'
 */
router.put('/:id', (0, authMiddleware_1.auth)('admin'), cloudinary_1.upload.single('image'), onboarding_controller_1.updateOnboardingById);
/**
 * @swagger
 * /v1/api/onboarding/{id}:
 *   delete:
 *     summary: Delete onboarding item (soft delete)
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', (0, authMiddleware_1.auth)('admin'), onboarding_controller_1.deleteOnboardingById);
exports.onboardingRouter = router;
