import express from 'express';
import { auth } from '../../middlewares/authMiddleware';
import { upload } from '../../config/cloudinary';
import {
  createAdvertise,
  getAllAdvertisements,
  getAdvertiseById,
  updateAdvertiseById,
  deleteAdvertiseById,
} from './advertise.controller';

const router = express.Router();

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
 *               link:
 *                 type: string
 *                 description: Optional URL to open when the ad is clicked
 *                 example: https://example.com/promo
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
router.post('/', auth('admin'), upload.single('image'), createAdvertise);

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
router.get('/', getAllAdvertisements);

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
router.get('/:id', getAdvertiseById);

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
 *               link:
 *                 type: string
 *                 description: Optional URL to open when the ad is clicked
 *                 example: https://example.com/promo
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
router.put('/:id', auth('admin'), upload.single('image'), updateAdvertiseById);

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
router.delete('/:id', auth('admin'), deleteAdvertiseById);

export const advertiseRouter = router;
