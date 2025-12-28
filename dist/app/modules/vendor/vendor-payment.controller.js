"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorPaymentController = exports.handleVendorPaymentWebhook = exports.verifyVendorPayment = exports.createVendorPaymentOrder = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const vendorPackage_model_1 = require("./vendorPackage.model");
const appError_1 = require("../../errors/appError");
// Razorpay Configuration
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});
// Generate unique receipt ID for Razorpay
const generateReceiptId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `VND_${timestamp}_${randomStr}`.toUpperCase();
};
// Create Razorpay order for vendor package payment
const createVendorPaymentOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { packageId, customerDetails } = req.body;
        if (!packageId || !customerDetails) {
            return next(new appError_1.appError('Package ID and customer details are required', 400));
        }
        // Validate package
        const pkg = yield vendorPackage_model_1.VendorPackage.findById(packageId);
        if (!pkg || !pkg.isActive) {
            return next(new appError_1.appError('Package not found or inactive', 404));
        }
        const receiptId = generateReceiptId();
        const amount = pkg.price;
        // Create Razorpay order
        const razorpayOrder = yield razorpay.orders.create({
            amount: amount * 100, // Razorpay expects amount in paise
            currency: 'INR',
            receipt: receiptId,
            notes: {
                packageId: String(pkg._id),
                packageName: pkg.name,
                customerName: customerDetails.name,
                customerEmail: customerDetails.email,
                customerPhone: customerDetails.phone,
            },
        });
        res.status(201).json({
            success: true,
            statusCode: 201,
            message: 'Payment order created successfully',
            data: {
                orderId: receiptId,
                razorpayOrderId: razorpayOrder.id,
                amount: amount,
                currency: razorpayOrder.currency,
                packageId: pkg._id,
                packageName: pkg.name,
                keyId: process.env.RAZORPAY_KEY_ID,
            },
        });
    }
    catch (error) {
        console.error('Razorpay order error:', error.message);
        return next(new appError_1.appError(error.message || 'Failed to create payment order', 500));
    }
});
exports.createVendorPaymentOrder = createVendorPaymentOrder;
// Verify Razorpay payment signature
const verifyVendorPayment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return next(new appError_1.appError('Payment details are required', 400));
        }
        // Verify signature
        const generatedSignature = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        const isValid = generatedSignature === razorpay_signature;
        if (!isValid) {
            return next(new appError_1.appError('Invalid payment signature', 400));
        }
        // Fetch payment details from Razorpay
        const payment = yield razorpay.payments.fetch(razorpay_payment_id);
        res.json({
            success: true,
            statusCode: 200,
            message: 'Payment verified successfully',
            data: {
                verified: true,
                orderId: orderId,
                razorpayOrderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                amount: Number(payment.amount) / 100, // Convert from paise to rupees
                status: payment.status,
            },
        });
    }
    catch (error) {
        console.error('Payment verification error:', error.message);
        return next(new appError_1.appError('Failed to verify payment', 500));
    }
});
exports.verifyVendorPayment = verifyVendorPayment;
// Webhook handler for Razorpay
const handleVendorPaymentWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookBody = JSON.stringify(req.body);
        // Verify webhook signature
        const expectedSignature = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
            .update(webhookBody)
            .digest('hex');
        if (webhookSignature === expectedSignature) {
            const event = req.body.event;
            const payload = req.body.payload;
            if (event === 'payment.captured') {
                console.log('Vendor payment webhook received:', payload.payment.entity.id);
                // Payment confirmed via webhook
                // The actual form submission happens from frontend after verifyVendorPayment
            }
        }
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(200).json({ success: true }); // Always return 200 to acknowledge
    }
});
exports.handleVendorPaymentWebhook = handleVendorPaymentWebhook;
exports.VendorPaymentController = {
    createVendorPaymentOrder: exports.createVendorPaymentOrder,
    verifyVendorPayment: exports.verifyVendorPayment,
    handleVendorPaymentWebhook: exports.handleVendorPaymentWebhook,
};
