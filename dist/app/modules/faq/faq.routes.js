"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.faqRouter = void 0;
const express_1 = __importDefault(require("express"));
const faq_controller_1 = require("./faq.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
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
 *           example: "How do I book movie tickets on IFMDB?"
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
 *                 example: "How do I book movie tickets on IFMDB?"
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
router.post('/', (0, authMiddleware_1.auth)('admin'), faq_controller_1.createFAQ);
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
router.get('/', faq_controller_1.getAllFAQs);
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
router.get('/:id', faq_controller_1.getFAQById);
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
router.put('/:id', (0, authMiddleware_1.auth)('admin'), faq_controller_1.updateFAQById);
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
router.delete('/:id', (0, authMiddleware_1.auth)('admin'), faq_controller_1.deleteFAQById);
// Generate FAQ answer using AI
router.post('/generate-answer', (0, authMiddleware_1.auth)('admin'), faq_controller_1.generateFAQAnswer);
exports.faqRouter = router;
