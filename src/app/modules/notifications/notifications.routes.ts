import express from 'express';
import { NotificationController } from './notifications.controller';
import validateRequest from '../../middlewares/validateRequest';
import { NotificationValidation } from './notifications.validation';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
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
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/', auth(), NotificationController.getUserNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get('/unread-count', auth(), NotificationController.getUnreadCount);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:notificationId/read', auth(), NotificationController.markAsRead);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/mark-all-read', auth(), NotificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
router.delete('/:notificationId', auth(), NotificationController.deleteNotification);

/**
 * @swagger
 * /notifications/device-token/register:
 *   post:
 *     summary: Register device token for push notifications
 *     description: Register a device token (FCM token) for receiving push notifications on mobile/web
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceToken
 *               - deviceType
 *             properties:
 *               deviceToken:
 *                 type: string
 *                 description: Firebase Cloud Messaging (FCM) device token
 *               deviceType:
 *                 type: string
 *                 enum: [android, ios, web]
 *                 description: Type of device
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   model:
 *                     type: string
 *                   osVersion:
 *                     type: string
 *                   appVersion:
 *                     type: string
 *     responses:
 *       200:
 *         description: Device token registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     deviceToken:
 *                       type: string
 *                     deviceType:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 */
router.post(
  '/device-token/register',
  auth(),
  validateRequest(NotificationValidation.registerDeviceTokenValidation),
  NotificationController.registerDeviceToken
);

/**
 * @swagger
 * /notifications/device-token/unregister:
 *   post:
 *     summary: Unregister device token
 *     description: Unregister a device token to stop receiving push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceToken
 *             properties:
 *               deviceToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device token unregistered successfully
 */
router.post(
  '/device-token/unregister',
  auth(),
  validateRequest(NotificationValidation.unregisterDeviceTokenValidation),
  NotificationController.unregisterDeviceToken
);

/**
 * @swagger
 * /notifications/device-tokens:
 *   get:
 *     summary: Get user's device tokens
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Device tokens retrieved successfully
 */
router.get('/device-tokens', auth(), NotificationController.getUserDeviceTokens);

/**
 * @swagger
 * /notifications/test-push:
 *   post:
 *     summary: Send test push notification
 *     description: Send a test push notification to user's registered devices
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Test notification sent successfully
 */
router.post(
  '/test-push',
  auth(),
  validateRequest(NotificationValidation.sendTestPushNotificationValidation),
  NotificationController.sendTestPushNotification
);

export default router;
