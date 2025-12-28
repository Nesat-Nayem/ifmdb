import express from 'express';
import { DashboardController } from './dashboard.controller';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /v1/api/dashboard/stats:
 *   get:
 *     summary: Get comprehensive dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 */
router.get('/stats', auth('admin', 'vendor'), DashboardController.getDashboardStats);

/**
 * @swagger
 * /v1/api/dashboard/transactions:
 *   get:
 *     summary: Get all platform transactions (Admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit, platform_fee, pending_credit, pending_to_available]
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [events, movie_watch]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/transactions', auth('admin'), DashboardController.getAllTransactions);

/**
 * @swagger
 * /v1/api/dashboard/video-purchases:
 *   get:
 *     summary: Get video purchase transactions
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Video purchases retrieved successfully
 */
router.get('/video-purchases', auth('admin', 'vendor'), DashboardController.getVideoPurchases);

/**
 * @swagger
 * /v1/api/dashboard/vendor-registrations:
 *   get:
 *     summary: Get vendor registration applications and payments (Admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor registrations retrieved successfully
 */
router.get('/vendor-registrations', auth('admin'), DashboardController.getVendorRegistrations);

export default router;
