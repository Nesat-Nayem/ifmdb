"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const watch_videos_controller_1 = require("./watch-videos.controller");
const razorpay_payment_controller_1 = require("./razorpay-payment.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const watch_videos_validation_1 = require("./watch-videos.validation");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
// ==================== DEEP LINK ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/redirect:
 *   get:
 *     summary: Handle deep link redirects
 *     description: Smart redirect for mobile app deep linking - redirects to app if installed, otherwise to store
 *     tags: [Watch Videos - Deep Links]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID to redirect to
 *     responses:
 *       302:
 *         description: Redirect to appropriate destination
 */
router.get('/redirect', watch_videos_controller_1.WatchVideoController.handleDeepLinkRedirect);
// ==================== CHANNEL ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/channels:
 *   post:
 *     summary: Create a new channel
 *     description: Create a new video channel for uploading content
 *     tags: [Watch Videos - Channels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChannelCreate'
 *     responses:
 *       201:
 *         description: Channel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Channel created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Channel'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/channels', (0, authMiddleware_1.auth)(), (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.createChannelValidation), watch_videos_controller_1.WatchVideoController.createChannel);
/**
 * @swagger
 * /v1/api/watch-videos/channels:
 *   get:
 *     summary: Get all channels
 *     description: Retrieve a list of all video channels with pagination
 *     tags: [Watch Videos - Channels]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by channel name
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verified status
 *     responses:
 *       200:
 *         description: Channels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Channels retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     channels:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Channel'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 */
router.get('/channels', (0, authMiddleware_1.optionalAuth)(), watch_videos_controller_1.WatchVideoController.getAllChannels);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{id}:
 *   get:
 *     summary: Get channel by ID
 *     description: Retrieve detailed information about a specific channel
 *     tags: [Watch Videos - Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *         example: 67890abcdef1234567890123
 *     responses:
 *       200:
 *         description: Channel retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Channel retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Channel'
 *       404:
 *         description: Channel not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/channels/:id', (0, authMiddleware_1.auth)(), watch_videos_controller_1.WatchVideoController.getChannelById);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{id}:
 *   put:
 *     summary: Update channel
 *     description: Update channel information (owner only)
 *     tags: [Watch Videos - Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *         example: 67890abcdef1234567890123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChannelUpdate'
 *     responses:
 *       200:
 *         description: Channel updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Channel updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Channel'
 *       404:
 *         description: Channel not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/channels/:id', (0, authMiddleware_1.auth)(), (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.updateChannelValidation), watch_videos_controller_1.WatchVideoController.updateChannel);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{id}:
 *   delete:
 *     summary: Delete channel (soft delete)
 *     description: Soft delete a channel (owner only)
 *     tags: [Watch Videos - Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *         example: 67890abcdef1234567890123
 *     responses:
 *       200:
 *         description: Channel deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Channel deleted successfully
 *       404:
 *         description: Channel not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/channels/:id', (0, authMiddleware_1.auth)(), watch_videos_controller_1.WatchVideoController.deleteChannel);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/subscribe:
 *   post:
 *     summary: Subscribe to a channel
 *     description: Subscribe to a channel to receive updates
 *     tags: [Watch Videos - Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *         example: 67890abcdef1234567890123
 *     responses:
 *       200:
 *         description: Subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Subscribed to channel successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     channelId:
 *                       type: string
 *                       example: 67890abcdef1234567890123
 *                     subscriberCount:
 *                       type: number
 *                       example: 125001
 */
router.post('/channels/:channelId/subscribe', (0, authMiddleware_1.auth)(), watch_videos_controller_1.WatchVideoController.subscribeToChannel);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/unsubscribe:
 *   post:
 *     summary: Unsubscribe from a channel
 *     description: Unsubscribe from a channel
 *     tags: [Watch Videos - Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *         example: 67890abcdef1234567890123
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Unsubscribed from channel successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     channelId:
 *                       type: string
 *                       example: 67890abcdef1234567890123
 *                     subscriberCount:
 *                       type: number
 *                       example: 124999
 */
router.post('/channels/:channelId/unsubscribe', (0, authMiddleware_1.auth)(), watch_videos_controller_1.WatchVideoController.unsubscribeFromChannel);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/toggle-notification:
 *   patch:
 *     summary: Toggle notification for a subscribed channel
 *     description: Enable or disable notifications for a subscribed channel
 *     tags: [Watch Videos - Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *         example: 67890abcdef1234567890123
 *     responses:
 *       200:
 *         description: Notification settings updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Notification settings updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     isNotificationEnabled:
 *                       type: boolean
 *                       example: true
 */
router.patch('/channels/:channelId/toggle-notification', (0, authMiddleware_1.auth)(), watch_videos_controller_1.WatchVideoController.toggleNotification);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/subscription:
 *   get:
 *     summary: Check subscription status
 *     description: Check if the user is subscribed to a channel
 *     tags: [Watch Videos - Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *         example: 67890abcdef1234567890123
 *     responses:
 *       200:
 *         description: Subscription status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Subscription status retrieved
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionStatus'
 */
router.get('/channels/:channelId/subscription', (0, authMiddleware_1.auth)(), watch_videos_controller_1.WatchVideoController.checkSubscription);
/**
 * @swagger
 * /v1/api/watch-videos/channels/{channelId}/videos:
 *   get:
 *     summary: Get all videos from a channel
 *     description: Retrieve all videos uploaded by a specific channel
 *     tags: [Watch Videos - Channels]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *         example: 67890abcdef1234567890123
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Videos retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     videos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WatchVideo'
 *                     pagination:
 *                       type: object
 */
router.get('/channels/:channelId/videos', watch_videos_controller_1.WatchVideoController.getVideosByChannel);
/**
 * @swagger
 * /v1/api/watch-videos/user/subscriptions:
 *   get:
 *     summary: Get user's subscribed channels
 *     description: Retrieve all channels the user is subscribed to
 *     tags: [Watch Videos - Channels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Subscriptions retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       channel:
 *                         $ref: '#/components/schemas/Channel'
 *                       isNotificationEnabled:
 *                         type: boolean
 *                         example: true
 *                       subscribedAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/user/subscriptions', (0, authMiddleware_1.auth)(), watch_videos_controller_1.WatchVideoController.getUserSubscriptions);
// ==================== CATEGORY ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/categories:
 *   post:
 *     summary: Create a new category
 *     description: Create a new video category for organizing content
 *     tags: [Watch Videos - Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WatchVideoCategoryCreate'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/WatchVideoCategory'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/categories', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.createCategoryValidation), watch_videos_controller_1.WatchVideoController.createCategory);
/**
 * @swagger
 * /v1/api/watch-videos/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve all video categories
 *     tags: [Watch Videos - Categories]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Filter by parent category ID
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Categories retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WatchVideoCategory'
 */
router.get('/categories', watch_videos_controller_1.WatchVideoController.getAllCategories);
/**
 * @swagger
 * /v1/api/watch-videos/categories/{id}:
 *   put:
 *     summary: Update category
 *     description: Update an existing video category
 *     tags: [Watch Videos - Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: 67890abcdef1234567890456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Action & Adventure
 *               description:
 *                 type: string
 *                 example: Updated description
 *               imageUrl:
 *                 type: string
 *               iconUrl:
 *                 type: string
 *               order:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Category updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/WatchVideoCategory'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/categories/:id', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.updateCategoryValidation), watch_videos_controller_1.WatchVideoController.updateCategory);
/**
 * @swagger
 * /v1/api/watch-videos/categories/{id}:
 *   delete:
 *     summary: Delete category (soft delete)
 *     description: Soft delete a video category
 *     tags: [Watch Videos - Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: 67890abcdef1234567890456
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Category deleted successfully
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/categories/:id', watch_videos_controller_1.WatchVideoController.deleteCategory);
// ==================== WATCH VIDEO ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos:
 *   post:
 *     summary: Create a new watch video
 *     description: Upload a new video (single movie or series)
 *     tags: [Watch Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WatchVideoCreate'
 *     responses:
 *       201:
 *         description: Video created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Video created successfully
 *                 data:
 *                   $ref: '#/components/schemas/WatchVideo'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', (0, authMiddleware_1.auth)(), (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.createWatchVideoValidation), watch_videos_controller_1.WatchVideoController.createWatchVideo);
/**
 * @swagger
 * /v1/api/watch-videos:
 *   get:
 *     summary: Get all watch videos with filtering and pagination
 *     description: Retrieve all videos with advanced filtering options
 *     tags: [Watch Videos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title, description, or tags
 *         example: batman
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category name
 *         example: Action & Adventure
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *         description: Filter by channel ID
 *       - in: query
 *         name: videoType
 *         schema:
 *           type: string
 *           enum: [single, series]
 *         description: Filter by video type
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *         example: Action
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language
 *         example: English
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by status
 *       - in: query
 *         name: isFree
 *         schema:
 *           type: boolean
 *         description: Filter by free/paid
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field
 *         example: releaseDate
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *         example: desc
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Videos retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     videos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WatchVideo'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 150
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 15
 */
router.get('/', (0, authMiddleware_1.optionalAuth)(), (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.getWatchVideosValidation), watch_videos_controller_1.WatchVideoController.getAllWatchVideos);
/**
 * @swagger
 * /v1/api/watch-videos/featured:
 *   get:
 *     summary: Get featured videos
 *     description: Retrieve all featured videos
 *     tags: [Watch Videos]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of featured videos to retrieve
 *     responses:
 *       200:
 *         description: Featured videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Featured videos retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WatchVideo'
 */
router.get('/featured', watch_videos_controller_1.WatchVideoController.getFeaturedVideos);
/**
 * @swagger
 * /v1/api/watch-videos/trending:
 *   get:
 *     summary: Get trending videos
 *     description: Retrieve trending videos based on views and engagement
 *     tags: [Watch Videos]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trending videos to retrieve
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to consider for trending
 *     responses:
 *       200:
 *         description: Trending videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Trending videos retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WatchVideo'
 */
router.get('/trending', watch_videos_controller_1.WatchVideoController.getTrendingVideos);
/**
 * @swagger
 * /v1/api/watch-videos/recommended:
 *   get:
 *     summary: Get recommended videos
 *     description: Get personalized video recommendations for the user
 *     tags: [Watch Videos]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Recommended videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Recommended videos retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WatchVideo'
 */
router.get('/recommended', watch_videos_controller_1.WatchVideoController.getRecommendedVideos);
/**
 * @swagger
 * /v1/api/watch-videos/purchases:
 *   get:
 *     summary: Get all purchases (admin)
 *     description: Retrieve all video purchases (admin only)
 *     tags: [Watch Videos - Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *     responses:
 *       200:
 *         description: Purchases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Purchases retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     purchases:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VideoPurchase'
 *                     pagination:
 *                       type: object
 */
router.get('/purchases', razorpay_payment_controller_1.RazorpayVideoPaymentController.getAllPurchases);
/**
 * @swagger
 * /v1/api/watch-videos/{id}:
 *   get:
 *     summary: Get watch video by ID
 *     description: Retrieve detailed information about a specific video
 *     tags: [Watch Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *     responses:
 *       200:
 *         description: Video retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Video retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/WatchVideo'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', watch_videos_controller_1.WatchVideoController.getWatchVideoById);
/**
 * @swagger
 * /v1/api/watch-videos/{id}:
 *   put:
 *     summary: Update watch video
 *     description: Update video information (owner only)
 *     tags: [Watch Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: The Dark Knight - Updated
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               isFeatured:
 *                 type: boolean
 *               defaultPrice:
 *                 type: number
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Video updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/WatchVideo'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.updateWatchVideoValidation), watch_videos_controller_1.WatchVideoController.updateWatchVideo);
/**
 * @swagger
 * /v1/api/watch-videos/{id}:
 *   delete:
 *     summary: Delete watch video (soft delete)
 *     description: Soft delete a video (owner only)
 *     tags: [Watch Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Video deleted successfully
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', watch_videos_controller_1.WatchVideoController.deleteWatchVideo);
// ==================== EPISODE & SEASON ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/seasons:
 *   post:
 *     summary: Add a new season to a series
 *     description: Add a new season to a series video
 *     tags: [Watch Videos - Episodes]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seasonNumber]
 *             properties:
 *               seasonNumber:
 *                 type: number
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: Season 1
 *               description:
 *                 type: string
 *                 example: The first season of the epic series
 *               releaseDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Season added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Season added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Season'
 */
router.post('/:videoId/seasons', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.addSeasonValidation), watch_videos_controller_1.WatchVideoController.addSeason);
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/seasons/{seasonNumber}/episodes:
 *   post:
 *     summary: Add an episode to a season
 *     description: Add a new episode to a specific season
 *     tags: [Watch Videos - Episodes]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *       - in: path
 *         name: seasonNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season number
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [episodeNumber, title, videoUrl, duration]
 *             properties:
 *               episodeNumber:
 *                 type: number
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: Pilot
 *               description:
 *                 type: string
 *                 example: The beginning of an epic journey
 *               videoUrl:
 *                 type: string
 *                 example: https://stream.moviemart.com/series/s1e1.m3u8
 *               thumbnailUrl:
 *                 type: string
 *                 example: https://res.cloudinary.com/demo/image/upload/v1724300000/moviemart/episodes/s1e1.jpg
 *               duration:
 *                 type: number
 *                 example: 3600
 *                 description: Duration in seconds
 *               releaseDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Episode added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Episode added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Episode'
 */
router.post('/:videoId/seasons/:seasonNumber/episodes', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.addEpisodeValidation), watch_videos_controller_1.WatchVideoController.addEpisode);
// ==================== REVIEW & RATING ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/reviews:
 *   post:
 *     summary: Add or update a review
 *     description: Add or update a review and rating for a video
 *     tags: [Watch Videos - Reviews]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VideoReviewCreate'
 *     responses:
 *       200:
 *         description: Review added/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Review added successfully
 *                 data:
 *                   $ref: '#/components/schemas/VideoReview'
 */
router.post('/:videoId/reviews', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.addReviewValidation), watch_videos_controller_1.WatchVideoController.addReview);
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/reviews:
 *   get:
 *     summary: Get all reviews for a video
 *     description: Retrieve all reviews and ratings for a specific video
 *     tags: [Watch Videos - Reviews]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, createdAt, helpfulCount]
 *         description: Sort reviews by field
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Reviews retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VideoReview'
 *                     averageRating:
 *                       type: number
 *                       example: 8.5
 *                     totalReviews:
 *                       type: number
 *                       example: 1542
 *                     pagination:
 *                       type: object
 */
router.get('/:videoId/reviews', watch_videos_controller_1.WatchVideoController.getVideoReviews);
// ==================== LIKE ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/like:
 *   post:
 *     summary: Toggle like on a video
 *     description: Like or unlike a video
 *     tags: [Watch Videos - Likes]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Video liked successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     isLiked:
 *                       type: boolean
 *                       example: true
 *                     likeCount:
 *                       type: number
 *                       example: 98501
 */
router.post('/:videoId/like', watch_videos_controller_1.WatchVideoController.toggleLike);
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/like/{userId}:
 *   get:
 *     summary: Check if user liked a video
 *     description: Check if a specific user has liked a video
 *     tags: [Watch Videos - Likes]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Like status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Like status retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     isLiked:
 *                       type: boolean
 *                       example: true
 */
router.get('/:videoId/like/:userId', watch_videos_controller_1.WatchVideoController.checkLikeStatus);
// ==================== WATCH HISTORY ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/progress:
 *   post:
 *     summary: Update watch progress
 *     description: Update user's watch progress for a video or episode
 *     tags: [Watch Videos - History]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WatchProgress'
 *     responses:
 *       200:
 *         description: Watch progress updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Watch progress updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       type: number
 *                       example: 50
 *                       description: Progress percentage
 *                     isCompleted:
 *                       type: boolean
 *                       example: false
 */
router.post('/:videoId/progress', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.updateWatchProgressValidation), watch_videos_controller_1.WatchVideoController.updateWatchProgress);
/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/history:
 *   get:
 *     summary: Get user's watch history
 *     description: Retrieve user's complete watch history
 *     tags: [Watch Videos - History]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Watch history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Watch history retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           video:
 *                             $ref: '#/components/schemas/WatchVideo'
 *                           watchedDuration:
 *                             type: number
 *                             example: 4560
 *                           totalDuration:
 *                             type: number
 *                             example: 9120
 *                           progress:
 *                             type: number
 *                             example: 50
 *                           lastWatchedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 */
router.get('/user/:userId/history', watch_videos_controller_1.WatchVideoController.getWatchHistory);
/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/continue-watching:
 *   get:
 *     summary: Get user's continue watching list
 *     description: Retrieve videos that user has started but not completed
 *     tags: [Watch Videos - History]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Continue watching list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Continue watching list retrieved
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       video:
 *                         $ref: '#/components/schemas/WatchVideo'
 *                       progress:
 *                         type: number
 *                         example: 45
 *                       lastWatchedAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/user/:userId/continue-watching', watch_videos_controller_1.WatchVideoController.getContinueWatching);
// ==================== USER PURCHASES ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/user/{userId}/purchases:
 *   get:
 *     summary: Get user's purchased videos
 *     description: Retrieve all videos purchased by a specific user
 *     tags: [Watch Videos - Purchases]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: purchaseType
 *         schema:
 *           type: string
 *           enum: [rent, buy]
 *     responses:
 *       200:
 *         description: Purchases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Purchases retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     purchases:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VideoPurchase'
 *                     pagination:
 *                       type: object
 */
router.get('/user/:userId/purchases', watch_videos_controller_1.WatchVideoController.getUserPurchases);
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/access/{userId}:
 *   get:
 *     summary: Check if user has access to video
 *     description: Check if user has purchased or has access to watch a video
 *     tags: [Watch Videos - Purchases]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Access status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Access status retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasAccess:
 *                       type: boolean
 *                       example: true
 *                     isFree:
 *                       type: boolean
 *                       example: false
 *                     purchaseType:
 *                       type: string
 *                       enum: [rent, buy]
 *                       example: buy
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 */
router.get('/:videoId/access/:userId', watch_videos_controller_1.WatchVideoController.checkVideoAccess);
// ==================== RAZORPAY PAYMENT ROUTES ====================
/**
 * @swagger
 * /v1/api/watch-videos/{videoId}/payment/create-order:
 *   post:
 *     summary: Create Razorpay payment order for video purchase
 *     description: Create a Razorpay payment order to purchase or rent a video
 *     tags: [Watch Videos - Razorpay Payment]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: 67890abcdef1234567890789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentOrderCreate'
 *     responses:
 *       200:
 *         description: Payment order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Payment order created successfully
 *                 data:
 *                   $ref: '#/components/schemas/PaymentOrderResponse'
 *       400:
 *         description: Validation error or video already purchased
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:videoId/payment/create-order', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.createPaymentOrderValidation), razorpay_payment_controller_1.RazorpayVideoPaymentController.createVideoPaymentOrder);
/**
 * @swagger
 * /v1/api/watch-videos/payment/verify:
 *   post:
 *     summary: Verify Razorpay payment
 *     description: Verify the Razorpay payment signature after payment completion
 *     tags: [Watch Videos - Razorpay Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: ORDER_20231218_123456
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Payment verified successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentStatus:
 *                       type: string
 *                       enum: [pending, completed, failed]
 *                       example: completed
 *                     purchase:
 *                       $ref: '#/components/schemas/VideoPurchase'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/payment/verify', razorpay_payment_controller_1.RazorpayVideoPaymentController.verifyVideoPayment);
/**
 * @swagger
 * /v1/api/watch-videos/payment/status/{orderId}:
 *   get:
 *     summary: Get payment status
 *     description: Get the current status of a payment order
 *     tags: [Watch Videos - Razorpay Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: ORDER_20231218_123456
 *     responses:
 *       200:
 *         description: Payment status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Payment status retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       example: ORDER_20231218_123456
 *                     paymentStatus:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                       example: completed
 *                     amount:
 *                       type: number
 *                       example: 299
 *                     currency:
 *                       type: string
 *                       example: INR
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/payment/status/:orderId', razorpay_payment_controller_1.RazorpayVideoPaymentController.getVideoPaymentStatus);
/**
 * @swagger
 * /v1/api/watch-videos/payment/webhook:
 *   post:
 *     summary: Razorpay webhook handler
 *     description: Handle Razorpay payment webhooks (internal use)
 *     tags: [Watch Videos - Razorpay Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Webhook payload from payment gateway
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Webhook processed successfully
 */
router.post('/payment/webhook', razorpay_payment_controller_1.RazorpayVideoPaymentController.handleVideoPaymentWebhook);
/**
 * @swagger
 * /v1/api/watch-videos/payment/refund/{purchaseId}:
 *   post:
 *     summary: Initiate refund
 *     description: Initiate a refund for a video purchase
 *     tags: [Watch Videos - Razorpay Payment]
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase ID
 *         example: 67890abcdef1234567891111
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Video quality issues
 *     responses:
 *       200:
 *         description: Refund initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Refund initiated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     refundId:
 *                       type: string
 *                       example: REFUND_20231218_123456
 *                     status:
 *                       type: string
 *                       example: pending
 *                     amount:
 *                       type: number
 *                       example: 299
 *       404:
 *         description: Purchase not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/payment/refund/:purchaseId', (0, validateRequest_1.default)(watch_videos_validation_1.WatchVideoValidation.initiateRefundValidation), razorpay_payment_controller_1.RazorpayVideoPaymentController.initiateVideoRefund);
/**
 * @swagger
 * /v1/api/watch-videos/vendor/{vendorId}/purchases:
 *   get:
 *     summary: Get vendor's video purchases
 *     description: Retrieve all purchases for videos uploaded by a vendor
 *     tags: [Watch Videos - Vendor]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter purchases from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter purchases until this date
 *     responses:
 *       200:
 *         description: Vendor purchases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Vendor purchases retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     purchases:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VideoPurchase'
 *                     totalRevenue:
 *                       type: number
 *                       example: 45780
 *                     totalPurchases:
 *                       type: number
 *                       example: 153
 *                     pagination:
 *                       type: object
 */
router.get('/vendor/:vendorId/purchases', razorpay_payment_controller_1.RazorpayVideoPaymentController.getVendorPurchases);
// ==================== VIDEO EXPIRY MANAGEMENT (Admin) ====================
/**
 * @swagger
 * /v1/api/watch-videos/admin/scheduled-videos:
 *   get:
 *     summary: Get scheduled/expiring videos
 *     description: Get videos with visibility schedule (admin only)
 *     tags: [Watch Videos - Admin]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, expiring, expired]
 *         description: Filter by schedule status
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Days ahead for expiring filter
 *     responses:
 *       200:
 *         description: Scheduled videos retrieved
 */
router.get('/admin/scheduled-videos', (0, authMiddleware_1.auth)('admin'), watch_videos_controller_1.WatchVideoController.getScheduledVideos);
/**
 * @swagger
 * /v1/api/watch-videos/admin/process-expired:
 *   post:
 *     summary: Process expired videos manually
 *     description: Manually trigger processing of expired videos (admin only)
 *     tags: [Watch Videos - Admin]
 *     responses:
 *       200:
 *         description: Expired videos processed
 */
router.post('/admin/process-expired', (0, authMiddleware_1.auth)('admin'), watch_videos_controller_1.WatchVideoController.processExpiredVideosManually);
/**
 * @swagger
 * /v1/api/watch-videos/admin/expiring-soon:
 *   get:
 *     summary: Get videos expiring soon
 *     description: Get videos that will expire in the next N days (admin only)
 *     tags: [Watch Videos - Admin]
 *     parameters:
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Expiring videos retrieved
 */
router.get('/admin/expiring-soon', (0, authMiddleware_1.auth)('admin'), watch_videos_controller_1.WatchVideoController.getUpcomingExpiringVideos);
exports.default = router;
