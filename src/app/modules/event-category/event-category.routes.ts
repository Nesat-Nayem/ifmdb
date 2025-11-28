import express from 'express';
import { EventCategoryController } from './event-category.controller';
import validateRequest from '../../middlewares/validateRequest';
import { EventCategoryValidation } from './event-category.validation';
import { upload } from '../../config/cloudinary';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     EventCategory:
 *       type: object
 *       required:
 *         - name
 *         - image
 *       properties:
 *         _id:
 *           type: string
 *           description: Category ID
 *         name:
 *           type: string
 *           description: Category name
 *         image:
 *           type: string
 *           description: Category image URL
 *         isMusicShow:
 *           type: boolean
 *           description: Whether this is a music show category
 *           default: false
 *         isComedyShow:
 *           type: boolean
 *           description: Whether this is a comedy show category
 *           default: false
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *           default: true
 *         eventCount:
 *           type: number
 *           description: Number of events in this category
 *           default: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /v1/api/event-categories:
 *   post:
 *     summary: Create a new event category
 *     tags: [Event Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isMusicShow:
 *                 type: boolean
 *               isComedyShow:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Event category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/EventCategory'
 *       400:
 *         description: Bad request
 */
router.post(
  '/',
  upload.single('image'),
  EventCategoryController.createEventCategory
);

/**
 * @swagger
 * /v1/api/event-categories:
 *   get:
 *     summary: Get all event categories with filtering and pagination
 *     tags: [Event Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of categories per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by category name
 *       - in: query
 *         name: isMusicShow
 *         schema:
 *           type: boolean
 *         description: Filter by music show categories
 *       - in: query
 *         name: isComedyShow
 *         schema:
 *           type: boolean
 *         description: Filter by comedy show categories
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, eventCount]
 *           default: createdAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Event categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EventCategory'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get(
  '/',
  validateRequest(EventCategoryValidation.getEventCategoriesValidation),
  EventCategoryController.getAllEventCategories
);

/**
 * @swagger
 * /v1/api/event-categories/music-shows:
 *   get:
 *     summary: Get all music show categories
 *     tags: [Event Categories]
 *     responses:
 *       200:
 *         description: Music show categories retrieved successfully
 */
router.get('/music-shows', EventCategoryController.getMusicShowCategories);

/**
 * @swagger
 * /v1/api/event-categories/comedy-shows:
 *   get:
 *     summary: Get all comedy show categories
 *     tags: [Event Categories]
 *     responses:
 *       200:
 *         description: Comedy show categories retrieved successfully
 */
router.get('/comedy-shows', EventCategoryController.getComedyShowCategories);

/**
 * @swagger
 * /v1/api/event-categories/{id}:
 *   get:
 *     summary: Get event category by ID
 *     tags: [Event Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event category ID
 *     responses:
 *       200:
 *         description: Event category retrieved successfully
 *       404:
 *         description: Event category not found
 */
router.get('/:id', EventCategoryController.getEventCategoryById);

/**
 * @swagger
 * /v1/api/event-categories/{id}:
 *   put:
 *     summary: Update event category
 *     tags: [Event Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event category ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isMusicShow:
 *                 type: boolean
 *               isComedyShow:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Event category updated successfully
 *       404:
 *         description: Event category not found
 */
router.put(
  '/:id',
  upload.single('image'),
  EventCategoryController.updateEventCategory
);

/**
 * @swagger
 * /v1/api/event-categories/{id}:
 *   delete:
 *     summary: Delete event category (soft delete)
 *     tags: [Event Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event category ID
 *     responses:
 *       200:
 *         description: Event category deleted successfully
 *       404:
 *         description: Event category not found
 */
router.delete('/:id', EventCategoryController.deleteEventCategory);

/**
 * @swagger
 * /v1/api/event-categories/{id}/permanent:
 *   delete:
 *     summary: Permanently delete event category
 *     tags: [Event Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event category ID
 *     responses:
 *       200:
 *         description: Event category permanently deleted
 *       404:
 *         description: Event category not found
 */
router.delete('/:id/permanent', EventCategoryController.hardDeleteEventCategory);

export const eventCategoryRouter = router;
