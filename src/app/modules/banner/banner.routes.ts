import express from 'express';
import { 
  createBanner, 
  getAllBanners, 
  
  getBannerById, 
  updateBannerById, 
  deleteBannerById 
} from './banner.controller';
import { upload } from '../../config/cloudinary';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Banners
 *     description: Manage homepage banners
 */

/**
 * @swagger
 * /v1/api/banners:
 *   post:
 *     summary: Create a new banner
 *     description: Creates a banner with image upload. Only admin is allowed.
 *     tags: [Banners]
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
 *                 example: "IFMDB Summer Film Festival"
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               order:
 *                 type: integer
 *                 description: Lower numbers show first
 *                 example: 1
 *     responses:
 *       201:
 *         description: Banner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Banner created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Validation error or missing image
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create a new banner with image upload
router.post('/', auth('admin'), upload.single('image'), createBanner);

/**
 * @swagger
 * /v1/api/banners:
 *   get:
 *     summary: Get all banners
 *     description: Returns all non-deleted banners. Optionally filter only active banners.
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: If true, only active banners are returned
 *         example: true
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Banners retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Banner'
 */
// Get all banners (with optional active filter)
router.get('/', getAllBanners);

/**
 * @swagger
 * /v1/api/banners/{id}:
 *   get:
 *     summary: Get a banner by ID
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner retrieved successfully
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
 *                   $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get a single banner by ID
router.get('/:id', getBannerById);

/**
 * @swagger
 * /v1/api/banners/{id}:
 *   put:
 *     summary: Update a banner by ID
 *     description: Updates banner fields and optionally replaces the image. Only admin is allowed.
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Release Spotlight"
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *                 example: false
 *               order:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Banner updated successfully
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
 *                   $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Update a banner by ID with optional image upload
router.put('/:id', auth('admin'), upload.single('image'), updateBannerById);

/**
 * @swagger
 * /v1/api/banners/{id}:
 *   delete:
 *     summary: Delete a banner by ID (soft delete)
 *     description: Marks the banner as deleted. Only admin is allowed.
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner deleted successfully
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
 *                   $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Delete a banner by ID (soft delete)
router.delete('/:id', auth('admin'), deleteBannerById);

export const bannerRouter = router;
