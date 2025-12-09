import express from 'express';
import { WatchVideoController } from './watch-videos.controller';
import { WatchVideoPaymentController } from './watch-videos-payment.controller';
import validateRequest from '../../middlewares/validateRequest';
import { WatchVideoValidation } from './watch-videos.validation';

const router = express.Router();

// ==================== CHANNEL ROUTES ====================

/**
 * @swagger
 * /v1/api/watch-videos/channels:
 *   post:
 *     summary: Create a new channel
 *     tags: [Watch Videos - Channels]
 */
router.post(
  '/channels',
  validateRequest(WatchVideoValidation.createChannelValidation),
  WatchVideoController.createChannel
);

/**
 * @swagger
 * /v1/api/watch-videos/channels:
 *   get:
 *     summary: Get all channels
 *     tags: [Watch Videos - Channels]
 */
router.get('/channels', WatchVideoController.getAllChannels);

/**
 * @swagger
 * /v1/api/watch-videos/channels/{id}:
 *   get:
 *     summary: Get channel by ID
 *     tags: [Watch Videos - Channels]
 */
router.get('/channels/:id', WatchVideoController.getChannelById);

/**
 * @swagger
 * /v1/api/watch-videos/channels/{id}:
 *   put:
 *     summary: Update channel
 *     tags: [Watch Videos - Channels]
 */
router.put(
  '/channels/:id',
  validateRequest(WatchVideoValidation.updateChannelValidation),
  WatchVideoController.updateChannel
);

/**
 * @swagger
 * /v1/api/watch-videos/channels/{id}:
 *   delete:
 *     summary: Delete channel (soft delete)
 *     tags: [Watch Videos - Channels]
 */
router.delete('/channels/:id', WatchVideoController.deleteChannel);

/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/subscribe:
 *   post:
 *     summary: Subscribe to a channel
 *     tags: [Watch Videos - Channels]
 */
router.post(
  '/channels/:channelId/subscribe',
  validateRequest(WatchVideoValidation.subscribeValidation),
  WatchVideoController.subscribeToChannel
);

/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/unsubscribe:
 *   post:
 *     summary: Unsubscribe from a channel
 *     tags: [Watch Videos - Channels]
 */
router.post(
  '/channels/:channelId/unsubscribe',
  validateRequest(WatchVideoValidation.subscribeValidation),
  WatchVideoController.unsubscribeFromChannel
);

/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/subscription/{userId}:
 *   get:
 *     summary: Check subscription status
 *     tags: [Watch Videos - Channels]
 */
router.get(
  '/channels/:channelId/subscription/:userId',
  WatchVideoController.checkSubscription
);

/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/videos:
 *   get:
 *     summary: Get all videos from a channel
 *     tags: [Watch Videos - Channels]
 */
router.get('/channels/:channelId/videos', WatchVideoController.getVideosByChannel);

/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/subscriptions:
 *   get:
 *     summary: Get user's subscribed channels
 *     tags: [Watch Videos - Channels]
 */
router.get('/user/:userId/subscriptions', WatchVideoController.getUserSubscriptions);

// ==================== CATEGORY ROUTES ====================

/**
 * @swagger
 * /v1/api/watch-videos/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Watch Videos - Categories]
 */
router.post(
  '/categories',
  validateRequest(WatchVideoValidation.createCategoryValidation),
  WatchVideoController.createCategory
);

/**
 * @swagger
 * /v1/api/watch-videos/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Watch Videos - Categories]
 */
router.get('/categories', WatchVideoController.getAllCategories);

/**
 * @swagger
 * /v1/api/watch-videos/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Watch Videos - Categories]
 */
router.put(
  '/categories/:id',
  validateRequest(WatchVideoValidation.updateCategoryValidation),
  WatchVideoController.updateCategory
);

/**
 * @swagger
 * /v1/api/watch-videos/categories/{id}:
 *   delete:
 *     summary: Delete category (soft delete)
 *     tags: [Watch Videos - Categories]
 */
router.delete('/categories/:id', WatchVideoController.deleteCategory);

// ==================== WATCH VIDEO ROUTES ====================

/**
 * @swagger
 * /v1/api/watch-videos:
 *   post:
 *     summary: Create a new watch video
 *     tags: [Watch Videos]
 */
router.post(
  '/',
  validateRequest(WatchVideoValidation.createWatchVideoValidation),
  WatchVideoController.createWatchVideo
);

/**
 * @swagger
 * /v1/api/watch-videos:
 *   get:
 *     summary: Get all watch videos with filtering and pagination
 *     tags: [Watch Videos]
 */
router.get(
  '/',
  validateRequest(WatchVideoValidation.getWatchVideosValidation),
  WatchVideoController.getAllWatchVideos
);

/**
 * @swagger
 * /v1/api/watch-videos/featured:
 *   get:
 *     summary: Get featured videos
 *     tags: [Watch Videos]
 */
router.get('/featured', WatchVideoController.getFeaturedVideos);

/**
 * @swagger
 * /v1/api/watch-videos/trending:
 *   get:
 *     summary: Get trending videos
 *     tags: [Watch Videos]
 */
router.get('/trending', WatchVideoController.getTrendingVideos);

/**
 * @swagger
 * /v1/api/watch-videos/recommended:
 *   get:
 *     summary: Get recommended videos
 *     tags: [Watch Videos]
 */
router.get('/recommended', WatchVideoController.getRecommendedVideos);

/**
 * @swagger
 * /v1/api/watch-videos/{id}:
 *   get:
 *     summary: Get watch video by ID
 *     tags: [Watch Videos]
 */
router.get('/:id', WatchVideoController.getWatchVideoById);

/**
 * @swagger
 * /v1/api/watch-videos/{id}:
 *   put:
 *     summary: Update watch video
 *     tags: [Watch Videos]
 */
router.put(
  '/:id',
  validateRequest(WatchVideoValidation.updateWatchVideoValidation),
  WatchVideoController.updateWatchVideo
);

/**
 * @swagger
 * /v1/api/watch-videos/{id}:
 *   delete:
 *     summary: Delete watch video (soft delete)
 *     tags: [Watch Videos]
 */
router.delete('/:id', WatchVideoController.deleteWatchVideo);

// ==================== EPISODE & SEASON ROUTES ====================

/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/seasons:
 *   post:
 *     summary: Add a new season to a series
 *     tags: [Watch Videos - Episodes]
 */
router.post(
  '/:videoId/seasons',
  validateRequest(WatchVideoValidation.addSeasonValidation),
  WatchVideoController.addSeason
);

/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/seasons/{seasonNumber}/episodes:
 *   post:
 *     summary: Add an episode to a season
 *     tags: [Watch Videos - Episodes]
 */
router.post(
  '/:videoId/seasons/:seasonNumber/episodes',
  validateRequest(WatchVideoValidation.addEpisodeValidation),
  WatchVideoController.addEpisode
);

// ==================== REVIEW & RATING ROUTES ====================

/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/reviews:
 *   post:
 *     summary: Add or update a review
 *     tags: [Watch Videos - Reviews]
 */
router.post(
  '/:videoId/reviews',
  validateRequest(WatchVideoValidation.addReviewValidation),
  WatchVideoController.addReview
);

/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/reviews:
 *   get:
 *     summary: Get all reviews for a video
 *     tags: [Watch Videos - Reviews]
 */
router.get('/:videoId/reviews', WatchVideoController.getVideoReviews);

// ==================== LIKE ROUTES ====================

/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/like:
 *   post:
 *     summary: Toggle like on a video
 *     tags: [Watch Videos - Likes]
 */
router.post('/:videoId/like', WatchVideoController.toggleLike);

/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/like/{userId}:
 *   get:
 *     summary: Check if user liked a video
 *     tags: [Watch Videos - Likes]
 */
router.get('/:videoId/like/:userId', WatchVideoController.checkLikeStatus);

// ==================== WATCH HISTORY ROUTES ====================

/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/progress:
 *   post:
 *     summary: Update watch progress
 *     tags: [Watch Videos - History]
 */
router.post(
  '/:videoId/progress',
  validateRequest(WatchVideoValidation.updateWatchProgressValidation),
  WatchVideoController.updateWatchProgress
);

/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/history:
 *   get:
 *     summary: Get user's watch history
 *     tags: [Watch Videos - History]
 */
router.get('/user/:userId/history', WatchVideoController.getWatchHistory);

/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/continue-watching:
 *   get:
 *     summary: Get user's continue watching list
 *     tags: [Watch Videos - History]
 */
router.get('/user/:userId/continue-watching', WatchVideoController.getContinueWatching);

// ==================== USER PURCHASES ROUTES ====================

/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/purchases:
 *   get:
 *     summary: Get user's purchased videos
 *     tags: [Watch Videos - Purchases]
 */
router.get('/user/:userId/purchases', WatchVideoController.getUserPurchases);

/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/access/{userId}:
 *   get:
 *     summary: Check if user has access to video
 *     tags: [Watch Videos - Purchases]
 */
router.get('/:videoId/access/:userId', WatchVideoController.checkVideoAccess);

// ==================== PAYMENT ROUTES ====================

/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/payment/create-order:
 *   post:
 *     summary: Create payment order for video purchase
 *     tags: [Watch Videos - Payment]
 */
router.post(
  '/:videoId/payment/create-order',
  validateRequest(WatchVideoValidation.createPaymentOrderValidation),
  WatchVideoPaymentController.createVideoPaymentOrder
);

/**
 * @swagger
 * /v1/api/watch-videos/payment/verify/{orderId}:
 *   get:
 *     summary: Verify payment status
 *     tags: [Watch Videos - Payment]
 */
router.get('/payment/verify/:orderId', WatchVideoPaymentController.verifyVideoPayment);

/**
 * @swagger
 * /v1/api/watch-videos/payment/status/{orderId}:
 *   get:
 *     summary: Get payment status
 *     tags: [Watch Videos - Payment]
 */
router.get('/payment/status/:orderId', WatchVideoPaymentController.getVideoPaymentStatus);

/**
 * @swagger
 * /v1/api/watch-videos/payment/webhook:
 *   post:
 *     summary: Cashfree webhook handler
 *     tags: [Watch Videos - Payment]
 */
router.post('/payment/webhook', WatchVideoPaymentController.handleVideoPaymentWebhook);

/**
 * @swagger
 * /v1/api/watch-videos/payment/refund/{purchaseId}:
 *   post:
 *     summary: Initiate refund
 *     tags: [Watch Videos - Payment]
 */
router.post(
  '/payment/refund/:purchaseId',
  validateRequest(WatchVideoValidation.initiateRefundValidation),
  WatchVideoPaymentController.initiateVideoRefund
);

/**
 * @swagger
 * /v1/api/watch-videos/purchases:
 *   get:
 *     summary: Get all purchases (admin)
 *     tags: [Watch Videos - Admin]
 */
router.get('/purchases', WatchVideoPaymentController.getAllPurchases);

/**
 * @swagger
 * /v1/api/watch-videos/vendor/{vendorId}/purchases:
 *   get:
 *     summary: Get vendor's video purchases
 *     tags: [Watch Videos - Vendor]
 */
router.get('/vendor/:vendorId/purchases', WatchVideoPaymentController.getVendorPurchases);

export default router;
