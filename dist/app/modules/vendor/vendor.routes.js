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
 *         panNumber:
 *           type: string
 *           example: 'ABCDE1234F'
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
 *           example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/ifmdb/kyc/aadhar-front.jpg'
 *         aadharBackUrl:
 *           type: string
 *           example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/ifmdb/kyc/aadhar-back.jpg'
 *         panImageUrl:
 *           type: string
 *           example: 'https://res.cloudinary.com/demo/image/upload/v1724300000/ifmdb/kyc/pan.jpg'
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
 *     description: Authenticated users can submit application with KYC images. Use multipart/form-data.
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [vendorName, businessType, panNumber, address, email, phone]
 *             properties:
 *               vendorName:
 *                 type: string
 *               businessType:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *               panNumber:
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
router.post('/applications', (0, authMiddleware_1.auth)(), cloudinary_1.upload.fields([
    { name: 'aadharFront', maxCount: 1 },
    { name: 'aadharBack', maxCount: 1 },
    { name: 'panImage', maxCount: 1 },
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
exports.vendorRouter = router;
