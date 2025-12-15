"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const watch_videos_controller_1 = require("./watch-videos.controller");
const watch_videos_payment_controller_1 = require("./watch-videos-payment.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const watch_videos_validation_1 = require("./watch-videos.validation");
const router = express_1.default.Router();
// ==================== CHANNEL ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/channels:
 *   post:
 *     summary: Create a new channel
 *     tags: [Watch Videos - Channels]
 */
router.post('/channels', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.createChannelValidation), watch_videos_controller_1.WatchVideoController.createChannel);
/**
 * @swagger
 * /v1/api/watch-videos/channels:
 *   get:
 *     summary: Get all channels
 *     tags: [Watch Videos - Channels]
 */
router.get('/channels', watch_videos_controller_1.WatchVideoController.getAllChannels);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{id}:
 *   get:
 *     summary: Get channel by ID
 *     tags: [Watch Videos - Channels]
 */
router.get('/channels/:id', watch_videos_controller_1.WatchVideoController.getChannelById);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{id}:
 *   put:
 *     summary: Update channel
 *     tags: [Watch Videos - Channels]
 */
router.put('/channels/:id', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.updateChannelValidation), watch_videos_controller_1.WatchVideoController.updateChannel);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{id}:
 *   delete:
 *     summary: Delete channel (soft delete)
 *     tags: [Watch Videos - Channels]
 */
router.delete('/channels/:id', watch_videos_controller_1.WatchVideoController.deleteChannel);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/subscribe:
 *   post:
 *     summary: Subscribe to a channel
 *     tags: [Watch Videos - Channels]
 */
router.post('/channels/:channelId/subscribe', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.subscribeValidation), watch_videos_controller_1.WatchVideoController.subscribeToChannel);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/unsubscribe:
 *   post:
 *     summary: Unsubscribe from a channel
 *     tags: [Watch Videos - Channels]
 */
router.post('/channels/:channelId/unsubscribe', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.subscribeValidation), watch_videos_controller_1.WatchVideoController.unsubscribeFromChannel);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/subscription/{userId}:
 *   get:
 *     summary: Check subscription status
 *     tags: [Watch Videos - Channels]
 */
router.get('/channels/:channelId/subscription/:userId', watch_videos_controller_1.WatchVideoController.checkSubscription);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/videos:
 *   get:
 *     summary: Get all videos from a channel
 *     tags: [Watch Videos - Channels]
 */
router.get('/channels/:channelId/videos', watch_videos_controller_1.WatchVideoController.getVideosByChannel);
/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/subscriptions:
 *   get:
 *     summary: Get user's subscribed channels
 *     tags: [Watch Videos - Channels]
 */
router.get('/user/:userId/subscriptions', watch_videos_controller_1.WatchVideoController.getUserSubscriptions);
// ==================== CATEGORY ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Watch Videos - Categories]
 */
router.post('/categories', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.createCategoryValidation), watch_videos_controller_1.WatchVideoController.createCategory);
/**
 * @swagger
 * /v1/api/watch-videos/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Watch Videos - Categories]
 */
router.get('/categories', watch_videos_controller_1.WatchVideoController.getAllCategories);
/**
 * @swagger
 * /v1/api/watch-videos/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Watch Videos - Categories]
 */
router.put('/categories/:id', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.updateCategoryValidation), watch_videos_controller_1.WatchVideoController.updateCategory);
/**
 * @swagger
 * /v1/api/watch-videos/categories/{id}:
 *   delete:
 *     summary: Delete category (soft delete)
 *     tags: [Watch Videos - Categories]
 */
router.delete('/categories/:id', watch_videos_controller_1.WatchVideoController.deleteCategory);
// ==================== WATCH VIDEO ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos:
 *   post:
 *     summary: Create a new watch video
 *     tags: [Watch Videos]
 */
router.post('/', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.createWatchVideoValidation), watch_videos_controller_1.WatchVideoController.createWatchVideo);
/**
 * @swagger
 * /v1/api/watch-videos:
 *   get:
 *     summary: Get all watch videos with filtering and pagination
 *     tags: [Watch Videos]
 */
router.get('/', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.getWatchVideosValidation), watch_videos_controller_1.WatchVideoController.getAllWatchVideos);
/**
 * @swagger
 * /v1/api/watch-videos/featured:
 *   get:
 *     summary: Get featured videos
 *     tags: [Watch Videos]
 */
router.get('/featured', watch_videos_controller_1.WatchVideoController.getFeaturedVideos);
/**
 * @swagger
 * /v1/api/watch-videos/trending:
 *   get:
 *     summary: Get trending videos
 *     tags: [Watch Videos]
 */
router.get('/trending', watch_videos_controller_1.WatchVideoController.getTrendingVideos);
/**
 * @swagger
 * /v1/api/watch-videos/recommended:
 *   get:
 *     summary: Get recommended videos
 *     tags: [Watch Videos]
 */
router.get('/recommended', watch_videos_controller_1.WatchVideoController.getRecommendedVideos);
/**
 * @swagger
 * /v1/api/watch-videos/purchases:
 *   get:
 *     summary: Get all purchases (admin)
 *     tags: [Watch Videos - Admin]
 */
router.get('/purchases', watch_videos_payment_controller_1.WatchVideoPaymentController.getAllPurchases);
/**
 * @swagger
 * /v1/api/watch-videos/{id}:
 *   get:
 *     summary: Get watch video by ID
 *     tags: [Watch Videos]
 */
router.get('/:id', watch_videos_controller_1.WatchVideoController.getWatchVideoById);
/**
 * @swagger
 * /v1/api/watch-videos/{id}:
 *   put:
 *     summary: Update watch video
 *     tags: [Watch Videos]
 */
router.put('/:id', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.updateWatchVideoValidation), watch_videos_controller_1.WatchVideoController.updateWatchVideo);
/**
 * @swagger
 * /v1/api/watch-videos/{id}:
 *   delete:
 *     summary: Delete watch video (soft delete)
 *     tags: [Watch Videos]
 */
router.delete('/:id', watch_videos_controller_1.WatchVideoController.deleteWatchVideo);
// ==================== EPISODE & SEASON ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/seasons:
 *   post:
 *     summary: Add a new season to a series
 *     tags: [Watch Videos - Episodes]
 */
router.post('/:videoId/seasons', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.addSeasonValidation), watch_videos_controller_1.WatchVideoController.addSeason);
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/seasons/{seasonNumber}/episodes:
 *   post:
 *     summary: Add an episode to a season
 *     tags: [Watch Videos - Episodes]
 */
router.post('/:videoId/seasons/:seasonNumber/episodes', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.addEpisodeValidation), watch_videos_controller_1.WatchVideoController.addEpisode);
// ==================== REVIEW & RATING ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/reviews:
 *   post:
 *     summary: Add or update a review
 *     tags: [Watch Videos - Reviews]
 */
router.post('/:videoId/reviews', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.addReviewValidation), watch_videos_controller_1.WatchVideoController.addReview);
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/reviews:
 *   get:
 *     summary: Get all reviews for a video
 *     tags: [Watch Videos - Reviews]
 */
router.get('/:videoId/reviews', watch_videos_controller_1.WatchVideoController.getVideoReviews);
// ==================== LIKE ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/like:
 *   post:
 *     summary: Toggle like on a video
 *     tags: [Watch Videos - Likes]
 */
router.post('/:videoId/like', watch_videos_controller_1.WatchVideoController.toggleLike);
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/like/{userId}:
 *   get:
 *     summary: Check if user liked a video
 *     tags: [Watch Videos - Likes]
 */
router.get('/:videoId/like/:userId', watch_videos_controller_1.WatchVideoController.checkLikeStatus);
// ==================== WATCH HISTORY ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/progress:
 *   post:
 *     summary: Update watch progress
 *     tags: [Watch Videos - History]
 */
router.post('/:videoId/progress', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.updateWatchProgressValidation), watch_videos_controller_1.WatchVideoController.updateWatchProgress);
/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/history:
 *   get:
 *     summary: Get user's watch history
 *     tags: [Watch Videos - History]
 */
router.get('/user/:userId/history', watch_videos_controller_1.WatchVideoController.getWatchHistory);
/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/continue-watching:
 *   get:
 *     summary: Get user's continue watching list
 *     tags: [Watch Videos - History]
 */
router.get('/user/:userId/continue-watching', watch_videos_controller_1.WatchVideoController.getContinueWatching);
// ==================== USER PURCHASES ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/purchases:
 *   get:
 *     summary: Get user's purchased videos
 *     tags: [Watch Videos - Purchases]
 */
router.get('/user/:userId/purchases', watch_videos_controller_1.WatchVideoController.getUserPurchases);
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/access/{userId}:
 *   get:
 *     summary: Check if user has access to video
 *     tags: [Watch Videos - Purchases]
 */
router.get('/:videoId/access/:userId', watch_videos_controller_1.WatchVideoController.checkVideoAccess);
// ==================== PAYMENT ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/payment/create-order:
 *   post:
 *     summary: Create payment order for video purchase
 *     tags: [Watch Videos - Payment]
 */
router.post('/:videoId/payment/create-order', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.createPaymentOrderValidation), watch_videos_payment_controller_1.WatchVideoPaymentController.createVideoPaymentOrder);
/**
 * @swagger
 * /v1/api/watch-videos/payment/verify/{orderId}:
 *   get:
 *     summary: Verify payment status
 *     tags: [Watch Videos - Payment]
 */
router.get('/payment/verify/:orderId', watch_videos_payment_controller_1.WatchVideoPaymentController.verifyVideoPayment);
/**
 * @swagger
 * /v1/api/watch-videos/payment/status/{orderId}:
 *   get:
 *     summary: Get payment status
 *     tags: [Watch Videos - Payment]
 */
router.get('/payment/status/:orderId', watch_videos_payment_controller_1.WatchVideoPaymentController.getVideoPaymentStatus);
/**
 * @swagger
 * /v1/api/watch-videos/payment/webhook:
 *   post:
 *     summary: Cashfree webhook handler
 *     tags: [Watch Videos - Payment]
 */
router.post('/payment/webhook', watch_videos_payment_controller_1.WatchVideoPaymentController.handleVideoPaymentWebhook);
/**
 * @swagger
 * /v1/api/watch-videos/payment/refund/{purchaseId}:
 *   post:
 *     summary: Initiate refund
 *     tags: [Watch Videos - Payment]
 */
router.post('/payment/refund/:purchaseId', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.initiateRefundValidation), watch_videos_payment_controller_1.WatchVideoPaymentController.initiateVideoRefund);
/**
 * @swagger
 * /v1/api/watch-videos/vendor/{vendorId}/purchases:
 *   get:
 *     summary: Get vendor's video purchases
 *     tags: [Watch Videos - Vendor]
 */
router.get('/vendor/:vendorId/purchases', watch_videos_payment_controller_1.WatchVideoPaymentController.getVendorPurchases);
exports.default = router;
