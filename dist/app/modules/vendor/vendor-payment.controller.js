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
const axios_1 = __importDefault(require("axios"));
const vendorPackage_model_1 = require("./vendorPackage.model");
const appError_1 = require("../../errors/appError");
// Cashfree API Configuration
const CASHFREE_API_URL = process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
// Generate unique order ID for Cashfree
const generateOrderId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `VND${timestamp}${randomStr}`.toUpperCase();
};
// Create Cashfree order for vendor package payment
const createVendorPaymentOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { packageId, customerDetails, returnUrl } = req.body;
        if (!packageId || !customerDetails) {
            return next(new appError_1.appError('Package ID and customer details are required', 400));
        }
        // Validate package
        const pkg = yield vendorPackage_model_1.VendorPackage.findById(packageId);
        if (!pkg || !pkg.isActive) {
            return next(new appError_1.appError('Package not found or inactive', 404));
        }
        const orderId = generateOrderId();
        const amount = pkg.price;
        // Create Cashfree order
        const cashfreeResponse = yield axios_1.default.post(`${CASHFREE_API_URL}/orders`, {
            order_id: orderId,
            order_amount: amount,
            order_currency: 'INR',
            customer_details: {
                customer_id: customerDetails.email.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20),
                customer_name: customerDetails.name,
                customer_email: customerDetails.email,
                customer_phone: customerDetails.phone,
            },
            order_meta: {
                return_url: returnUrl || `${process.env.FRONTEND_URL}/become-vendor/payment-success?order_id={order_id}`,
                notify_url: `${process.env.BACKEND_URL}/v1/api/vendors/payment/webhook`,
            },
            order_note: `Vendor Package: ${pkg.name}`,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
            },
        });
        const cashfreeOrder = cashfreeResponse.data;
        res.status(201).json({
            success: true,
            statusCode: 201,
            message: 'Payment order created successfully',
            data: {
                orderId: cashfreeOrder.order_id,
                sessionId: cashfreeOrder.payment_session_id,
                orderAmount: amount,
                packageId: pkg._id,
                packageName: pkg.name,
            },
        });
    }
    catch (error) {
        console.error('Cashfree order error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return next(new appError_1.appError(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Failed to create payment order', 500));
    }
});
exports.createVendorPaymentOrder = createVendorPaymentOrder;
// Verify Cashfree payment status
const verifyVendorPayment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return next(new appError_1.appError('Order ID is required', 400));
        }
        // Get payment status from Cashfree
        const cashfreeResponse = yield axios_1.default.get(`${CASHFREE_API_URL}/orders/${orderId}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
            },
        });
        const orderData = cashfreeResponse.data;
        const isPaid = orderData.order_status === 'PAID';
        res.json({
            success: true,
            statusCode: 200,
            message: isPaid ? 'Payment successful' : 'Payment not completed',
            data: {
                orderId: orderData.order_id,
                orderStatus: orderData.order_status,
                orderAmount: orderData.order_amount,
                isPaid,
                transactionId: orderData.cf_order_id,
            },
        });
    }
    catch (error) {
        console.error('Payment verification error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return next(new appError_1.appError('Failed to verify payment', 500));
    }
});
exports.verifyVendorPayment = verifyVendorPayment;
// Webhook handler for Cashfree
const handleVendorPaymentWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { data } = req.body;
        if (((_a = data === null || data === void 0 ? void 0 : data.order) === null || _a === void 0 ? void 0 : _a.order_status) === 'PAID') {
            console.log('Vendor payment webhook received:', data.order.order_id);
            // Payment confirmed via webhook
            // The actual form submission happens from frontend after verifyVendorPayment
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
