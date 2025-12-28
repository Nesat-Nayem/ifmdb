"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboard_controller_1 = require("./dashboard.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
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
router.get('/stats', (0, authMiddleware_1.auth)('admin', 'vendor'), dashboard_controller_1.DashboardController.getDashboardStats);
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
router.get('/transactions', (0, authMiddleware_1.auth)('admin'), dashboard_controller_1.DashboardController.getAllTransactions);
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
router.get('/video-purchases', (0, authMiddleware_1.auth)('admin', 'vendor'), dashboard_controller_1.DashboardController.getVideoPurchases);
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
router.get('/vendor-registrations', (0, authMiddleware_1.auth)('admin'), dashboard_controller_1.DashboardController.getVendorRegistrations);
exports.default = router;
