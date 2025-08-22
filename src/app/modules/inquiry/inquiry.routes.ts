import express from 'express';
import { auth } from '../../middlewares/authMiddleware';
import { 
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryById,
  deleteInquiryById
} from './inquiry.controller';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Inquiry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: '66c8df21b9a1e1c23a456789'
 *         name:
 *           type: string
 *           example: 'Ayesha Khan'
 *         email:
 *           type: string
 *           example: 'ayesha.khan@example.com'
 *         phone:
 *           type: string
 *           example: '+971501234567'
 *         purpose:
 *           type: string
 *           example: 'Corporate partnership'
 *         message:
 *           type: string
 *           example: 'We would like to discuss a co-marketing campaign for movie premieres.'
 *         createdAt:
 *           type: string
 *           example: '8/22/2025, 10:18:00 AM'
 *         updatedAt:
 *           type: string
 *           example: '8/22/2025, 10:19:05 AM'
 */

/**
 * @swagger
 * tags:
 *   - name: Inquiries
 *     description: Manage customer inquiries
 */

/**
 * @swagger
 * /v1/api/inquiries:
 *   post:
 *     summary: Submit an inquiry
 *     tags: [Inquiries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, purpose, message]
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Ayesha Khan'
 *               email:
 *                 type: string
 *                 example: 'ayesha.khan@example.com'
 *               phone:
 *                 type: string
 *                 example: '+971501234567'
 *               purpose:
 *                 type: string
 *                 example: 'Corporate partnership'
 *               message:
 *                 type: string
 *                 example: 'We would like to discuss a co-marketing campaign for movie premieres.'
 *     responses:
 *       201:
 *         description: Inquiry created
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
 *                   $ref: '#/components/schemas/Inquiry'
 */
router.post('/', createInquiry);

/**
 * @swagger
 * /v1/api/inquiries:
 *   get:
 *     summary: Get all inquiries
 *     description: Admin only
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: purpose
 *         schema:
 *           type: string
 *         example: 'Corporate partnership'
 *     responses:
 *       200:
 *         description: Inquiries
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
 *                     $ref: '#/components/schemas/Inquiry'
 */
router.get('/', auth('admin'), getAllInquiries);

/**
 * @swagger
 * /v1/api/inquiries/{id}:
 *   get:
 *     summary: Get inquiry by ID
 *     description: Admin only
 *     tags: [Inquiries]
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
 *         description: Inquiry item
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
 *                   $ref: '#/components/schemas/Inquiry'
 */
router.get('/:id', auth('admin'), getInquiryById);

/**
 * @swagger
 * /v1/api/inquiries/{id}:
 *   put:
 *     summary: Update an inquiry
 *     description: Admin only
 *     tags: [Inquiries]
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
 *               name:
 *                 type: string
 *                 example: 'Ayesha Khan'
 *               email:
 *                 type: string
 *                 example: 'ayesha.khan@example.com'
 *               phone:
 *                 type: string
 *                 example: '+971501234567'
 *               purpose:
 *                 type: string
 *                 example: 'Support'
 *               message:
 *                 type: string
 *                 example: 'Can you help me update my booking?'
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', auth('admin'), updateInquiryById);

/**
 * @swagger
 * /v1/api/inquiries/{id}:
 *   delete:
 *     summary: Delete an inquiry (soft delete)
 *     description: Admin only
 *     tags: [Inquiries]
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
router.delete('/:id', auth('admin'), deleteInquiryById);

export const inquiryRouter = router;
