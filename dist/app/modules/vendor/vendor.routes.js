"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorRouter = void 0;
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const cloudinary_1 = require("../../config/cloudinary");
const vendor_controller_1 = require("./vendor.controller");
const vendor_payment_controller_1 = require("./vendor-payment.controller");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Vendors
 *     description: Vendor registration and approval
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     VendorApplication:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: '66f2d1ab8b1a2c3456789001'
 *         userId:
 *           type: string
 *           example: '66f2d1ab8b1a2c3456789aaa'
 *         vendorName:
 *           type: string
 *           example: 'ABC Events Pvt Ltd'
 *         businessType:
 *           type: string
 *           example: 'Event Organizer'
 *         gstNumber:
 *           type: string
 *           example: '27ABCDE1234F1Z5'
 *         country:
 *           type: string
 *           example: 'IN'
 *         address:
 *           type: string
 *           example: 'Office 21, Bay Square, Business Bay, Dubai'
 *         email:
 *           type: string
 *           example: 'vendor@example.com'
 *         phone:
 *           type: string
 *           example: '+971501234567'
 *         aadharFrontUrl:
 *           type: string
 *           example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/kyc/aadhar-front.jpg'
 *         aadharBackUrl:
 *           type: string
 *           example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/kyc/aadhar-back.jpg'
 *         panImageUrl:
 *           type: string
 *           example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/kyc/pan.jpg'
 *         nationalIdUrl:
 *           type: string
 *           example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/kyc/national-id.jpg'
 *         passportUrl:
 *           type: string
 *           example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/kyc/passport.jpg'
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           example: 'pending'
 *         rejectionReason:
 *           type: string
 *           example: ''
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */
/**
 * @swagger
 * /v1/api/vendors/applications:
 *   post:
 *     summary: Submit a vendor registration application
 *     description: Anyone can submit a vendor application with KYC images. Use multipart/form-data. No authentication required.
 *     tags: [Vendors]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [vendorName, businessType, address, email, phone]
 *             properties:
 *               vendorName:
 *                 type: string
 *               businessType:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *               country:
 *                 type: string
 *               address:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               aadharFront:
 *                 type: string
 *                 format: binary
 *               aadharBack:
 *                 type: string
 *                 format: binary
 *               panImage:
 *                 type: string
 *                 format: binary
 *               nationalId:
 *                 type: string
 *                 format: binary
 *               passport:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Application submitted
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
 *                   $ref: '#/components/schemas/VendorApplication'
 */
router.post('/applications', cloudinary_1.upload.fields([
    { name: 'aadharFrontUrl', maxCount: 1 },
    { name: 'aadharBackUrl', maxCount: 1 },
    { name: 'panImageUrl', maxCount: 1 },
    { name: 'nationalIdUrl', maxCount: 1 },
    { name: 'passportUrl', maxCount: 1 },
]), vendor_controller_1.createVendorApplication);
/**
 * @swagger
 * /v1/api/vendors/applications:
 *   get:
 *     summary: List vendor applications
 *     description: Admin only. Filter by status or userId.
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Applications
 */
router.get('/applications', (0, authMiddleware_1.auth)('admin'), vendor_controller_1.listVendorApplications);
/**
 * @swagger
 * /v1/api/vendors/applications/{id}:
 *   get:
 *     summary: Get vendor application by ID
 *     description: Admin or application owner can view
 *     tags: [Vendors]
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
 *         description: Application
 */
router.get('/applications/:id', (0, authMiddleware_1.auth)(), vendor_controller_1.getVendorApplicationById);
/**
 * @swagger
 * /v1/api/vendors/applications/{id}/decision:
 *   patch:
 *     summary: Approve or reject an application
 *     description: Admin only
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [approve, reject]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Decision applied
 */
router.patch('/applications/:id/decision', (0, authMiddleware_1.auth)('admin'), vendor_controller_1.decideVendorApplication);
router.delete('/applications/:id', (0, authMiddleware_1.auth)('admin'), vendor_controller_1.deleteVendorApplication);
// ============ VENDOR PACKAGES ROUTES ============
/**
 * @swagger
 * /v1/api/vendors/packages:
 *   get:
 *     summary: List all vendor packages
 *     tags: [Vendors]
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Packages list
 */
router.get('/packages', vendor_controller_1.listVendorPackages);
/**
 * @swagger
 * /v1/api/vendors/packages:
 *   post:
 *     summary: Create a new vendor package
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: number
 *               durationType:
 *                 type: string
 *                 enum: [days, months, years]
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPopular:
 *                 type: boolean
 *               sortOrder:
 *                 type: number
 *     responses:
 *       201:
 *         description: Package created
 */
router.post('/packages', (0, authMiddleware_1.auth)('admin'), vendor_controller_1.createVendorPackage);
router.get('/packages/:id', vendor_controller_1.getVendorPackageById);
router.put('/packages/:id', (0, authMiddleware_1.auth)('admin'), vendor_controller_1.updateVendorPackage);
router.delete('/packages/:id', (0, authMiddleware_1.auth)('admin'), vendor_controller_1.deleteVendorPackage);
// ============ PLATFORM SETTINGS ROUTES ============
/**
 * @swagger
 * /v1/api/vendors/settings:
 *   get:
 *     summary: Get platform settings (fees)
 *     tags: [Vendors]
 *     responses:
 *       200:
 *         description: Settings retrieved
 */
router.get('/settings', vendor_controller_1.getPlatformSettings);
/**
 * @swagger
 * /v1/api/vendors/settings:
 *   put:
 *     summary: Update a platform setting
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value]
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: number
 *     responses:
 *       200:
 *         description: Setting updated
 */
router.put('/settings', (0, authMiddleware_1.auth)('admin'), vendor_controller_1.updatePlatformSetting);
// ============ VENDOR PAYMENT ROUTES ============
/**
 * @swagger
 * /v1/api/vendors/payment/create-order:
 *   post:
 *     summary: Create Cashfree payment order for vendor package
 *     tags: [Vendors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [packageId, customerDetails]
 *             properties:
 *               packageId:
 *                 type: string
 *               customerDetails:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *               returnUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment order created
 */
router.post('/payment/create-order', vendor_payment_controller_1.createVendorPaymentOrder);
/**
 * @swagger
 * /v1/api/vendors/payment/verify/{orderId}:
 *   get:
 *     summary: Verify Cashfree payment status
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status
 */
router.post('/payment/verify/:orderId', vendor_payment_controller_1.verifyVendorPayment);
// Razorpay webhook
router.post('/payment/webhook', vendor_payment_controller_1.handleVendorPaymentWebhook);
exports.vendorRouter = router;
