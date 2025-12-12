import express from 'express';
import { 
  createFAQ, 
  getAllFAQs, 
  getFAQById, 
  updateFAQById, 
  deleteFAQById,
  generateFAQAnswer
} from './faq.controller';
import { auth } from '../../middlewares/authMiddleware';
import { adminMiddleware } from '../../middlewares/adminMiddleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FAQ:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "66c8c9f0a2b1e3d445678901"
 *         question:
 *           type: string
 *           example: "How do I book movie tickets on Moviemart?"
 *         answer:
 *           type: string
 *           example: "Search for a movie, select showtime, choose seats, and complete payment to confirm your booking."
 *         status:
 *           type: boolean
 *           description: Active status (maps to isActive in the database)
 *           example: true
 *         createdAt:
 *           type: string
 *           example: "8/22/2025, 10:10:00 AM"
 *         updatedAt:
 *           type: string
 *           example: "8/22/2025, 10:12:00 AM"
 */

/**
 * @swagger
 * tags:
 *   - name: FAQ
 *     description: Manage Frequently Asked Questions
 */

// Create a new FAQ (admin only)
/**
 * @swagger
 * /v1/api/faqs:
 *   post:
 *     summary: Create a new FAQ
 *     tags: [FAQ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question:
 *                 type: string
 *                 example: "How do I book movie tickets on Moviemart?"
 *               answer:
 *                 type: string
 *                 example: "Search for a movie, select showtime, choose seats, and complete payment to confirm your booking."
 *               status:
 *                 type: boolean
 *                 description: If true, FAQ is active (maps to isActive)
 *                 example: true
 *     responses:
 *       201:
 *         description: FAQ created
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
 *                   $ref: '#/components/schemas/FAQ'
 */
router.post('/', auth('admin'), createFAQ);

// Get all FAQs (public)
/**
 * @swagger
 * /v1/api/faqs:
 *   get:
 *     summary: Get all FAQs
 *     tags: [FAQ]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         example: true
 *         description: If true, only active FAQs are returned
 *     responses:
 *       200:
 *         description: FAQs
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
 *                     $ref: '#/components/schemas/FAQ'
 */
router.get('/', getAllFAQs);

// Get a single FAQ by ID (public)
/**
 * @swagger
 * /v1/api/faqs/{id}:
 *   get:
 *     summary: Get FAQ by ID
 *     tags: [FAQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ item
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
 *                   $ref: '#/components/schemas/FAQ'
 */
router.get('/:id', getFAQById);

// Update a FAQ by ID (admin only)
/**
 * @swagger
 * /v1/api/faqs/{id}:
 *   put:
 *     summary: Update a FAQ
 *     tags: [FAQ]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 example: "How do I cancel a booking?"
 *               answer:
 *                 type: string
 *                 example: "Go to your bookings, select the ticket, and click cancel before the cutoff time."
 *               status:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: FAQ updated
 */
router.put('/:id', auth('admin'), updateFAQById);

// Delete a FAQ by ID (admin only)
/**
 * @swagger
 * /v1/api/faqs/{id}:
 *   delete:
 *     summary: Delete a FAQ (soft delete)
 *     tags: [FAQ]
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
router.delete('/:id', auth('admin'), deleteFAQById);

// Generate FAQ answer using AI
router.post('/generate-answer', auth('admin'), generateFAQAnswer);

export const faqRouter = router;