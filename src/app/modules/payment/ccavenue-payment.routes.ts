import express from 'express';
import { CCAvenuePaymentController } from './ccavenue-payment.controller';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /v1/api/payment/ccavenue/callback:
 *   post:
 *     summary: Handle CCAvenue payment callback
 *     tags: [Payment - CCAvenue]
 *     description: This endpoint is called by CCAvenue after payment completion
 */
router.post('/callback', CCAvenuePaymentController.handleCCAvenueCallback);

/**
 * @swagger
 * /v1/api/payment/ccavenue/cancel:
 *   post:
 *     summary: Handle CCAvenue payment cancellation
 *     tags: [Payment - CCAvenue]
 *     description: This endpoint is called when user cancels payment on CCAvenue
 */
router.post('/cancel', CCAvenuePaymentController.handleCCAvenueCancelCallback);

/**
 * @swagger
 * /v1/api/payment/ccavenue/config-status:
 *   get:
 *     summary: Get CCAvenue configuration status
 *     tags: [Payment - CCAvenue]
 *     description: Check if CCAvenue is properly configured (admin only)
 */
router.get('/config-status', auth('admin'), CCAvenuePaymentController.getConfigStatus);

export default router;
