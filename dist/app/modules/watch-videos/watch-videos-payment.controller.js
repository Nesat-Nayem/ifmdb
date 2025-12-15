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
exports.WatchVideoPaymentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const watch_videos_model_1 = require("./watch-videos.model");
// Cashfree API Configuration
const CASHFREE_API_URL = process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
// Generate unique purchase reference
const generatePurchaseReference = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `VPR${timestamp}${randomStr}`.toUpperCase();
};
// Generate unique order ID for Cashfree
const generateOrderId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `VORD${timestamp}${randomStr}`.toUpperCase();
};
// Create Cashfree payment order for video purchase
const createVideoPaymentOrder = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { videoId } = req.params;
    const { userId, purchaseType = 'buy', countryCode = 'IN', customerDetails, returnUrl } = req.body;
    // Validate video
    const video = yield watch_videos_model_1.WatchVideo.findById(videoId).populate('channelId');
    if (!video || !video.isActive || video.status !== 'published') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Video not available for purchase',
            data: null,
        });
    }
    // Check if video is free
    if (video.isFree) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'This video is free to watch',
            data: null,
        });
    }
    // Check if already purchased
    const existingPurchase = yield watch_videos_model_1.VideoPurchase.findOne({
        userId,
        videoId,
        paymentStatus: 'completed',
        $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    });
    if (existingPurchase) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'You have already purchased this video',
            data: null,
        });
    }
    // Get price based on country
    let price = video.defaultPrice;
    let currency = 'INR';
    if (countryCode && video.countryPricing && video.countryPricing.length > 0) {
        const countryPrice = video.countryPricing.find((cp) => cp.countryCode === countryCode && cp.isActive);
        if (countryPrice) {
            price = countryPrice.price;
            currency = countryPrice.currency;
        }
    }
    // Calculate amounts
    const totalAmount = price;
    const taxAmount = Math.round(totalAmount * 0.18); // 18% GST
    const finalAmount = totalAmount + taxAmount;
    const purchaseReference = generatePurchaseReference();
    const orderId = generateOrderId();
    // Calculate expiry for rental (7 days)
    let expiresAt = null;
    if (purchaseType === 'rent') {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    try {
        // Create Cashfree order
        const cashfreeResponse = yield axios_1.default.post(`${CASHFREE_API_URL}/orders`, {
            order_id: orderId,
            order_amount: finalAmount,
            order_currency: currency,
            customer_details: {
                customer_id: userId,
                customer_name: customerDetails.name,
                customer_email: customerDetails.email,
                customer_phone: customerDetails.phone,
            },
            order_meta: {
                return_url: returnUrl || `${process.env.FRONTEND_URL}/watch-movie-deatils?videoId=${videoId}&order_id={order_id}`,
                notify_url: `${process.env.BACKEND_URL}/v1/api/watch-videos/payment/webhook`,
            },
            order_note: `Video: ${video.title} | Type: ${purchaseType}`,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
            },
        });
        const cashfreeOrder = cashfreeResponse.data;
        // Create purchase record with pending status
        const purchaseData = {
            userId: new mongoose_1.default.Types.ObjectId(userId),
            videoId: new mongoose_1.default.Types.ObjectId(videoId),
            purchaseType,
            amount: totalAmount,
            currency,
            countryCode,
            paymentStatus: 'pending',
            paymentMethod: 'cashfree',
            transactionId: orderId,
            purchaseReference,
            expiresAt,
            customerDetails,
            purchasedAt: new Date(),
        };
        const newPurchase = yield watch_videos_model_1.VideoPurchase.create(purchaseData);
        // Record initial transaction
        yield watch_videos_model_1.VideoPaymentTransaction.create({
            purchaseId: newPurchase._id,
            paymentGateway: 'cashfree',
            gatewayTransactionId: orderId,
            amount: finalAmount,
            currency,
            status: 'pending',
            paymentMethod: 'cashfree',
            gatewayResponse: cashfreeOrder,
        });
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.CREATED,
            success: true,
            message: 'Payment order created successfully',
            data: {
                purchase: newPurchase,
                cashfreeOrder: {
                    orderId: cashfreeOrder.order_id,
                    orderToken: cashfreeOrder.order_token,
                    paymentSessionId: cashfreeOrder.payment_session_id,
                    orderStatus: cashfreeOrder.order_status,
                    cfOrderId: cashfreeOrder.cf_order_id,
                },
                paymentLink: cashfreeOrder.payment_link,
                video: {
                    id: video._id,
                    title: video.title,
                    thumbnailUrl: video.thumbnailUrl
                }
            },
        });
    }
    catch (error) {
        console.error('Cashfree order creation error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to create payment order',
            data: ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || null,
        });
    }
}));
// Verify Cashfree payment for video
const verifyVideoPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { orderId } = req.params;
    try {
        // Fetch order status from Cashfree
        const cashfreeResponse = yield axios_1.default.get(`${CASHFREE_API_URL}/orders/${orderId}`, {
            headers: {
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
            },
        });
        const orderDetails = cashfreeResponse.data;
        // Find purchase by transaction ID (order ID)
        const purchase = yield watch_videos_model_1.VideoPurchase.findOne({ transactionId: orderId });
        if (!purchase) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.NOT_FOUND,
                success: false,
                message: 'Purchase not found',
                data: null,
            });
        }
        // Update transaction record
        yield watch_videos_model_1.VideoPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
            status: orderDetails.order_status === 'PAID' ? 'success' : orderDetails.order_status.toLowerCase(),
            gatewayResponse: orderDetails,
            processedAt: new Date(),
        });
        if (orderDetails.order_status === 'PAID') {
            // Update purchase to completed
            purchase.paymentStatus = 'completed';
            yield purchase.save();
            // Get video details
            const video = yield watch_videos_model_1.WatchVideo.findById(purchase.videoId)
                .populate('channelId', 'name logoUrl');
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Payment verified successfully. You can now watch the video!',
                data: {
                    purchase,
                    video,
                    paymentStatus: 'completed',
                    canWatch: true
                },
            });
        }
        else if (orderDetails.order_status === 'ACTIVE') {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Payment is still pending',
                data: {
                    paymentStatus: 'pending',
                    orderStatus: orderDetails.order_status,
                },
            });
        }
        else {
            // Payment failed
            purchase.paymentStatus = 'failed';
            yield purchase.save();
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: false,
                message: 'Payment failed',
                data: {
                    paymentStatus: 'failed',
                    orderStatus: orderDetails.order_status,
                },
            });
        }
    }
    catch (error) {
        console.error('Payment verification error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to verify payment',
            data: null,
        });
    }
}));
// Cashfree Webhook handler for video payments
const handleVideoPaymentWebhook = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = JSON.stringify(req.body);
    // Verify webhook signature
    const signatureData = timestamp + rawBody;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', CASHFREE_SECRET_KEY)
        .update(signatureData)
        .digest('base64');
    if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ message: 'Invalid signature' });
    }
    const { data, type } = req.body;
    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
        const orderId = data.order.order_id;
        // Find and update purchase
        const purchase = yield watch_videos_model_1.VideoPurchase.findOne({ transactionId: orderId });
        if (purchase && purchase.paymentStatus !== 'completed') {
            purchase.paymentStatus = 'completed';
            yield purchase.save();
            // Update transaction
            yield watch_videos_model_1.VideoPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
                status: 'success',
                gatewayResponse: data,
                processedAt: new Date(),
            });
        }
    }
    else if (type === 'PAYMENT_FAILED_WEBHOOK') {
        const orderId = data.order.order_id;
        yield watch_videos_model_1.VideoPurchase.findOneAndUpdate({ transactionId: orderId }, { paymentStatus: 'failed' });
        yield watch_videos_model_1.VideoPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
            status: 'failed',
            gatewayResponse: data,
            processedAt: new Date(),
        });
    }
    return res.status(200).json({ received: true });
}));
// Get payment status
const getVideoPaymentStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const purchase = yield watch_videos_model_1.VideoPurchase.findOne({ transactionId: orderId })
        .populate('videoId', 'title thumbnailUrl posterUrl duration videoType channelId')
        .populate('userId', 'name email phone');
    if (!purchase) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Purchase not found',
            data: null,
        });
    }
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Payment status retrieved',
        data: {
            purchase,
            canWatch: purchase.paymentStatus === 'completed',
        },
    });
}));
// Initiate refund
const initiateVideoRefund = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { purchaseId } = req.params;
    const { reason } = req.body;
    const purchase = yield watch_videos_model_1.VideoPurchase.findById(purchaseId);
    if (!purchase) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Purchase not found',
            data: null,
        });
    }
    if (purchase.paymentStatus !== 'completed') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Cannot refund - payment not completed',
            data: null,
        });
    }
    // Check if refund is within allowed period (24 hours)
    const hoursSincePurchase = (Date.now() - new Date(purchase.purchasedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSincePurchase > 24) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Refund period has expired (24 hours)',
            data: null,
        });
    }
    try {
        const refundId = `VREF${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
        const refundResponse = yield axios_1.default.post(`${CASHFREE_API_URL}/orders/${purchase.transactionId}/refunds`, {
            refund_id: refundId,
            refund_amount: purchase.amount,
            refund_note: reason || 'Customer requested refund',
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
            },
        });
        // Update purchase status
        purchase.paymentStatus = 'refunded';
        yield purchase.save();
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Refund initiated successfully',
            data: refundResponse.data,
        });
    }
    catch (error) {
        console.error('Refund error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to initiate refund',
            data: ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || null,
        });
    }
}));
// Get all purchases (admin)
const getAllPurchases = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { page = 1, limit = 10, videoId, userId, paymentStatus, startDate, endDate, sortBy = 'purchasedAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (videoId)
        query.videoId = videoId;
    if (userId)
        query.userId = userId;
    if (paymentStatus)
        query.paymentStatus = paymentStatus;
    if (startDate || endDate) {
        query.purchasedAt = {};
        if (startDate)
            query.purchasedAt.$gte = new Date(startDate);
        if (endDate)
            query.purchasedAt.$lte = new Date(endDate);
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (Number(page) - 1) * Number(limit);
    const [purchases, total] = yield Promise.all([
        watch_videos_model_1.VideoPurchase.find(query)
            .populate('videoId', 'title thumbnailUrl channelId')
            .populate('userId', 'name email')
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit)),
        watch_videos_model_1.VideoPurchase.countDocuments(query)
    ]);
    // Calculate total revenue
    const totalRevenue = yield watch_videos_model_1.VideoPurchase.aggregate([
        { $match: Object.assign(Object.assign({}, query), { paymentStatus: 'completed' }) },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Purchases retrieved successfully',
        data: purchases,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            totalRevenue: ((_a = totalRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0
        }
    });
}));
// Get vendor's video purchases (for vendors to see their earnings)
const getVendorPurchases = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { vendorId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    // Get all videos by this vendor
    const vendorVideos = yield watch_videos_model_1.WatchVideo.find({ uploadedBy: vendorId }).select('_id');
    const videoIds = vendorVideos.map(v => v._id);
    const query = {
        videoId: { $in: videoIds },
        paymentStatus: 'completed'
    };
    if (startDate || endDate) {
        query.purchasedAt = {};
        if (startDate)
            query.purchasedAt.$gte = new Date(startDate);
        if (endDate)
            query.purchasedAt.$lte = new Date(endDate);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [purchases, total, revenueData] = yield Promise.all([
        watch_videos_model_1.VideoPurchase.find(query)
            .populate('videoId', 'title thumbnailUrl')
            .populate('userId', 'name email')
            .sort({ purchasedAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        watch_videos_model_1.VideoPurchase.countDocuments(query),
        watch_videos_model_1.VideoPurchase.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Vendor purchases retrieved',
        data: purchases,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            totalRevenue: ((_a = revenueData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0
        }
    });
}));
exports.WatchVideoPaymentController = {
    createVideoPaymentOrder,
    verifyVideoPayment,
    handleVideoPaymentWebhook,
    getVideoPaymentStatus,
    initiateVideoRefund,
    getAllPurchases,
    getVendorPurchases,
};
