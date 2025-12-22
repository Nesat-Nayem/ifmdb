"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ccavenue_payment_controller_1 = require("./ccavenue-payment.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * /v1/api/payment/ccavenue/callback:
 *   post:
 *     summary: Handle CCAvenue payment callback
 *     tags: [Payment - CCAvenue]
 *     description: This endpoint is called by CCAvenue after payment completion
 */
router.post('/callback', ccavenue_payment_controller_1.CCAvenuePaymentController.handleCCAvenueCallback);
/**
 * @swagger
 * /v1/api/payment/ccavenue/cancel:
 *   post:
 *     summary: Handle CCAvenue payment cancellation
 *     tags: [Payment - CCAvenue]
 *     description: This endpoint is called when user cancels payment on CCAvenue
 */
router.post('/cancel', ccavenue_payment_controller_1.CCAvenuePaymentController.handleCCAvenueCancelCallback);
/**
 * @swagger
 * /v1/api/payment/ccavenue/config-status:
 *   get:
 *     summary: Get CCAvenue configuration status
 *     tags: [Payment - CCAvenue]
 *     description: Check if CCAvenue is properly configured (admin only)
 */
router.get('/config-status', (0, authMiddleware_1.auth)('admin'), ccavenue_payment_controller_1.CCAvenuePaymentController.getConfigStatus);
exports.default = router;
