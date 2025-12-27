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
exports.RazorpayVideoPaymentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const watch_videos_model_1 = require("./watch-videos.model");
const wallet_controller_1 = require("../wallet/wallet.controller");
const razorpayService_1 = __importDefault(require("../../services/razorpayService"));
// Generate unique purchase reference
const generatePurchaseReference = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `VPR${timestamp}${randomStr}`.toUpperCase();
};
// Create Razorpay payment order for video purchase
const createVideoPaymentOrder = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { videoId } = req.params;
    const { userId, purchaseType = 'buy', countryCode = 'IN', customerDetails, } = req.body;
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
    let currency = razorpayService_1.default.getCurrencyForCountry(countryCode);
    if (countryCode && video.countryPricing && video.countryPricing.length > 0) {
        const countryPrice = video.countryPricing.find((cp) => cp.countryCode === countryCode && cp.isActive);
        if (countryPrice) {
            price = countryPrice.price;
            currency = countryPrice.currency;
        }
    }
    // Calculate amounts (no GST for video purchases)
    const totalAmount = price;
    const finalAmount = totalAmount;
    const purchaseReference = generatePurchaseReference();
    // Calculate expiry for rental (7 days)
    let expiresAt = null;
    if (purchaseType === 'rent') {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    try {
        // Create Razorpay order
        const razorpayOrder = yield razorpayService_1.default.createOrder({
            amount: finalAmount,
            currency: currency,
            receipt: purchaseReference,
            notes: {
                videoId: videoId,
                userId: userId,
                purchaseType: purchaseType,
                customerName: customerDetails.name,
                customerEmail: customerDetails.email,
            },
        });
        // Create purchase record with pending status
        const purchaseData = {
            userId: new mongoose_1.default.Types.ObjectId(userId),
            videoId: new mongoose_1.default.Types.ObjectId(videoId),
            purchaseType,
            amount: totalAmount,
            currency,
            countryCode,
            paymentStatus: 'pending',
            paymentMethod: 'razorpay',
            transactionId: razorpayOrder.id,
            purchaseReference,
            expiresAt,
            customerDetails,
            purchasedAt: new Date(),
        };
        const newPurchase = yield watch_videos_model_1.VideoPurchase.create(purchaseData);
        // Record initial transaction
        yield watch_videos_model_1.VideoPaymentTransaction.create({
            purchaseId: newPurchase._id,
            paymentGateway: 'razorpay',
            gatewayTransactionId: razorpayOrder.id,
            amount: finalAmount,
            currency,
            status: 'pending',
            paymentMethod: 'razorpay',
            gatewayResponse: razorpayOrder,
        });
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.CREATED,
            success: true,
            message: 'Razorpay payment order created successfully',
            data: {
                purchase: newPurchase,
                paymentGateway: 'razorpay',
                razorpayOrder: {
                    orderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    keyId: razorpayService_1.default.getRazorpayKeyId(),
                },
                video: {
                    id: video._id,
                    title: video.title,
                    thumbnailUrl: video.thumbnailUrl
                }
            },
        });
    }
    catch (error) {
        console.error('Razorpay order creation error:', error);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to create payment order',
            data: error.message || null,
        });
    }
}));
// Verify Razorpay payment for video
const verifyVideoPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { orderId, paymentId, signature } = req.body;
    // Verify signature
    const isValid = razorpayService_1.default.verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Invalid payment signature',
            data: null,
        });
    }
    try {
        // Fetch payment details from Razorpay
        const payment = yield razorpayService_1.default.fetchPayment(paymentId);
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
            status: payment.status === 'captured' ? 'completed' : payment.status,
            gatewayResponse: payment,
            processedAt: new Date(),
        });
        if (payment.status === 'captured') {
            // Update purchase to completed
            purchase.paymentStatus = 'completed';
            yield purchase.save();
            // Get video details
            const video = yield watch_videos_model_1.WatchVideo.findById(purchase.videoId)
                .populate('channelId', 'name logoUrl');
            // Credit vendor wallet if video has a vendor
            const videoData = video;
            const purchaseData = purchase;
            if (videoData && videoData.uploadedBy && videoData.uploadedByType === 'vendor') {
                try {
                    yield wallet_controller_1.WalletController.creditVendorEarnings({
                        vendorId: videoData.uploadedBy.toString(),
                        amount: purchaseData.amount,
                        serviceType: 'movie_watch',
                        referenceType: 'video_purchase',
                        referenceId: purchaseData._id.toString(),
                        metadata: {
                            purchaseId: purchaseData._id.toString(),
                            customerName: ((_a = purchaseData.customerDetails) === null || _a === void 0 ? void 0 : _a.name) || '',
                            customerEmail: ((_b = purchaseData.customerDetails) === null || _b === void 0 ? void 0 : _b.email) || '',
                            itemTitle: videoData.title || '',
                        },
                    });
                }
                catch (walletError) {
                    console.error('Failed to credit vendor wallet:', walletError);
                }
            }
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
        else {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Payment is being processed',
                data: {
                    paymentStatus: payment.status,
                },
            });
        }
    }
    catch (error) {
        console.error('Payment verification error:', error);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to verify payment',
            data: null,
        });
    }
}));
// Razorpay Webhook handler for video payments
const handleVideoPaymentWebhook = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = JSON.stringify(req.body);
    // Verify webhook signature
    const isValid = razorpayService_1.default.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ message: 'Invalid signature' });
    }
    const { event, payload } = req.body;
    if (event === 'payment.captured') {
        const payment = payload.payment.entity;
        const orderId = payment.order_id;
        // Find and update purchase
        const purchase = yield watch_videos_model_1.VideoPurchase.findOne({ transactionId: orderId });
        if (purchase && purchase.paymentStatus !== 'completed') {
            purchase.paymentStatus = 'completed';
            yield purchase.save();
            // Update transaction
            yield watch_videos_model_1.VideoPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
                status: 'completed',
                gatewayResponse: payment,
                processedAt: new Date(),
            });
        }
    }
    else if (event === 'payment.failed') {
        const payment = payload.payment.entity;
        const orderId = payment.order_id;
        yield watch_videos_model_1.VideoPurchase.findOneAndUpdate({ transactionId: orderId }, { paymentStatus: 'failed' });
        yield watch_videos_model_1.VideoPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
            status: 'failed',
            gatewayResponse: payment,
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
        // Get the payment ID from transaction
        const transaction = yield watch_videos_model_1.VideoPaymentTransaction.findOne({
            purchaseId: purchase._id,
            status: 'completed'
        });
        if (!transaction || !transaction.gatewayResponse) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Payment transaction not found',
                data: null,
            });
        }
        // Get payment ID from gateway response
        const paymentId = transaction.gatewayResponse.id;
        const refund = yield razorpayService_1.default.refundPayment(paymentId, purchase.amount, { reason: reason || 'Customer requested refund' });
        // Update purchase status
        purchase.paymentStatus = 'refunded';
        yield purchase.save();
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Refund initiated successfully',
            data: refund,
        });
    }
    catch (error) {
        console.error('Refund error:', error);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to initiate refund',
            data: error.message || null,
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
exports.RazorpayVideoPaymentController = {
    createVideoPaymentOrder,
    verifyVideoPayment,
    handleVideoPaymentWebhook,
    getVideoPaymentStatus,
    initiateVideoRefund,
    getAllPurchases,
    getVendorPurchases,
};
