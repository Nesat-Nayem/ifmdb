import express from 'express';
import { 
  createHomepageCategory, 
  getAllHomepageCategories, 
  getHomepageCategoryById, 
  updateHomepageCategoryById, 
  deleteHomepageCategoryById 
} from './homepage-category.controller';
import { upload } from '../../config/cloudinary';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Homepage Categories
 *     description: |
 *       Manage homepage event category cards displayed on the frontend homepage.
 *       These are the category icons shown in the "The Best Of Live Events" section.
 *
 *       **Recommended Image Size:** 200 × 200 px (square icon)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HomepageCategory:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a9f1c2e4b0a1234567890a"
 *         title:
 *           type: string
 *           example: "MUSIC"
 *         image:
 *           type: string
 *           example: "https://res.cloudinary.com/demo/image/upload/category-music.png"
 *         link:
 *           type: string
 *           example: "/events?category=music"
 *         order:
 *           type: integer
 *           example: 1
 *         isActive:
 *           type: boolean
 *           example: true
 *         isDeleted:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           example: "1/6/2025, 12:00:00 AM"
 *         updatedAt:
 *           type: string
 *           example: "1/6/2025, 12:00:00 AM"
 */

/**
 * @swagger
 * /v1/api/homepage-categories:
 *   post:
 *     summary: Create a new homepage category
 *     description: |
 *       Creates a homepage event category card with image upload. Only admin is allowed.
 *
 *       **Recommended Image Size:** 200 × 200 px (square icon, PNG with transparent background preferred)
 *     tags: [Homepage Categories]
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
 *                 example: "MUSIC"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: "Upload category icon image. Recommended: 200×200px PNG."
 *               link:
 *                 type: string
 *                 example: "/events?category=music"
 *                 description: "URL path when user clicks the category card"
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
 *         description: Homepage category created successfully
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
 *                   example: Homepage category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/HomepageCategory'
 *       400:
 *         description: Validation error or missing image
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth('admin'), upload.single('image'), createHomepageCategory);

/**
 * @swagger
 * /v1/api/homepage-categories:
 *   get:
 *     summary: Get all homepage categories
 *     description: |
 *       Returns all non-deleted homepage categories. Optionally filter by active status.
 *
 *       **Frontend Usage:** `GET /v1/api/homepage-categories?active=true`
 *     tags: [Homepage Categories]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: If true, only active categories are returned
 *         example: true
 *     responses:
 *       200:
 *         description: Homepage categories retrieved successfully
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
 *                   example: Homepage categories retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HomepageCategory'
 */
router.get('/', getAllHomepageCategories);

/**
 * @swagger
 * /v1/api/homepage-categories/{id}:
 *   get:
 *     summary: Get a homepage category by ID
 *     tags: [Homepage Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Homepage category ID
 *     responses:
 *       200:
 *         description: Homepage category retrieved successfully
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
 *                   $ref: '#/components/schemas/HomepageCategory'
 *       404:
 *         description: Homepage category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getHomepageCategoryById);

/**
 * @swagger
 * /v1/api/homepage-categories/{id}:
 *   put:
 *     summary: Update a homepage category by ID
 *     description: Updates category fields and optionally replaces the image. Only admin is allowed.
 *     tags: [Homepage Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Homepage category ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "NIGHTLIFE"
 *               image:
 *                 type: string
 *                 format: binary
 *               link:
 *                 type: string
 *                 example: "/events?category=nightlife"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *               order:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Homepage category updated successfully
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
 *                   $ref: '#/components/schemas/HomepageCategory'
 *       404:
 *         description: Homepage category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', auth('admin'), upload.single('image'), updateHomepageCategoryById);

/**
 * @swagger
 * /v1/api/homepage-categories/{id}:
 *   delete:
 *     summary: Delete a homepage category by ID (soft delete)
 *     description: Marks the homepage category as deleted. Only admin is allowed.
 *     tags: [Homepage Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Homepage category ID
 *     responses:
 *       200:
 *         description: Homepage category deleted successfully
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
 *                   $ref: '#/components/schemas/HomepageCategory'
 *       404:
 *         description: Homepage category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', auth('admin'), deleteHomepageCategoryById);

export const homepageCategoryRouter = router;
