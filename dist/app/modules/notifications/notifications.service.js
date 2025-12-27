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
const notifications_model_1 = require("./notifications.model");
const watch_videos_model_1 = require("../watch-videos/watch-videos.model");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
class NotificationService {
    /**
     * Create a notification for a user
     */
    createNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield notifications_model_1.Notification.create({
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data || {},
                isRead: false,
                isSent: false
            });
            return notification;
        });
    }
    /**
     * Create notifications for multiple users
     */
    createBulkNotifications(notifications) {
        return __awaiter(this, void 0, void 0, function* () {
            const notificationDocs = notifications.map(notif => ({
                userId: notif.userId,
                type: notif.type,
                title: notif.title,
                message: notif.message,
                data: notif.data || {},
                isRead: false,
                isSent: false
            }));
            const created = yield notifications_model_1.Notification.insertMany(notificationDocs);
            return created;
        });
    }
    /**
     * Get notifications for a user
     */
    getUserNotifications(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, options = {}) {
            const { page = 1, limit = 20, unreadOnly = false } = options;
            const skip = (page - 1) * limit;
            const query = { userId };
            if (unreadOnly) {
                query.isRead = false;
            }
            const [notifications, total, unreadCount] = yield Promise.all([
                notifications_model_1.Notification.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                notifications_model_1.Notification.countDocuments(query),
                notifications_model_1.Notification.countDocuments({ userId, isRead: false })
            ]);
            return {
                notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                unreadCount
            };
        });
    }
    /**
     * Mark notification as read
     */
    markAsRead(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield notifications_model_1.Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true }, { new: true });
            return notification;
        });
    }
    /**
     * Mark all notifications as read for a user
     */
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield notifications_model_1.Notification.updateMany({ userId, isRead: false }, { isRead: true });
            return result;
        });
    }
    /**
     * Delete a notification
     */
    deleteNotification(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield notifications_model_1.Notification.findOneAndDelete({ _id: notificationId, userId });
            return result;
        });
    }
    /**
     * Get unread count for a user
     */
    getUnreadCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield notifications_model_1.Notification.countDocuments({ userId, isRead: false });
            return count;
        });
    }
    /**
     * Notify channel subscribers about new video
     */
    notifyChannelSubscribers(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all subscribers with notifications enabled
            const subscriptions = yield watch_videos_model_1.ChannelSubscription.find({
                channelId: data.channelId,
                isNotificationEnabled: true
            }).select('userId');
            if (subscriptions.length === 0) {
                return { notificationsSent: 0, pushNotificationsSent: 0 };
            }
            const userIds = subscriptions.map(sub => sub.userId);
            // Create in-app notifications
            const notifications = userIds.map(userId => ({
                userId,
                type: 'new_video',
                title: `New video from ${data.channelName}`,
                message: `${data.channelName} uploaded: ${data.videoTitle}`,
                data: {
                    channelId: data.channelId,
                    channelName: data.channelName,
                    videoId: data.videoId,
                    videoTitle: data.videoTitle,
                    thumbnailUrl: data.thumbnailUrl || ''
                }
            }));
            yield this.createBulkNotifications(notifications);
            // Send push notifications
            const pushNotificationsSent = yield this.sendPushNotificationsToUsers(userIds, {
                title: `New video from ${data.channelName}`,
                body: data.videoTitle,
                data: {
                    type: 'new_video',
                    channelId: data.channelId.toString(),
                    videoId: data.videoId.toString(),
                    channelName: data.channelName,
                    videoTitle: data.videoTitle,
                    thumbnailUrl: data.thumbnailUrl || ''
                }
            });
            return {
                notificationsSent: notifications.length,
                pushNotificationsSent
            };
        });
    }
    /**
     * Send push notifications to multiple users
     */
    sendPushNotificationsToUsers(userIds, notification) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if Firebase is initialized
                if (!firebase_admin_1.default.apps.length) {
                    console.warn('Firebase Admin SDK not initialized. Skipping push notifications.');
                    return 0;
                }
                // Get all active device tokens for these users
                const deviceTokens = yield notifications_model_1.UserDeviceToken.find({
                    userId: { $in: userIds },
                    isActive: true
                }).select('deviceToken deviceType');
                if (deviceTokens.length === 0) {
                    return 0;
                }
                const tokens = deviceTokens.map(dt => dt.deviceToken);
                // Prepare the message
                const message = {
                    notification: Object.assign({ title: notification.title, body: notification.body }, (notification.imageUrl && { imageUrl: notification.imageUrl })),
                    data: notification.data || {},
                    tokens
                };
                // Send to all tokens
                const response = yield firebase_admin_1.default.messaging().sendEachForMulticast(message);
                // Handle failed tokens
                if (response.failureCount > 0) {
                    const failedTokens = [];
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            failedTokens.push(tokens[idx]);
                            console.error('Failed to send to token:', tokens[idx], resp.error);
                        }
                    });
                    // Deactivate invalid tokens
                    if (failedTokens.length > 0) {
                        yield notifications_model_1.UserDeviceToken.updateMany({ deviceToken: { $in: failedTokens } }, { isActive: false });
                    }
                }
                return response.successCount;
            }
            catch (error) {
                console.error('Error sending push notifications:', error);
                return 0;
            }
        });
    }
    /**
     * Register a device token for push notifications
     */
    registerDeviceToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🔔 [Service] Registering device token...');
            console.log('🔔 [Service] User ID:', data.userId);
            console.log('🔔 [Service] Device Type:', data.deviceType);
            // Check if token already exists
            const existing = yield notifications_model_1.UserDeviceToken.findOne({ deviceToken: data.deviceToken });
            if (existing) {
                console.log('🔔 [Service] Token already exists, updating...');
                // Update existing token
                existing.userId = data.userId;
                existing.deviceType = data.deviceType;
                existing.deviceInfo = data.deviceInfo || existing.deviceInfo;
                existing.isActive = true;
                existing.lastUsed = new Date();
                yield existing.save();
                console.log('✅ [Service] Token updated successfully:', existing._id);
                return existing;
            }
            console.log('🔔 [Service] Creating new token...');
            // Create new token
            const deviceToken = yield notifications_model_1.UserDeviceToken.create({
                userId: data.userId,
                deviceToken: data.deviceToken,
                deviceType: data.deviceType,
                deviceInfo: data.deviceInfo || {},
                isActive: true,
                lastUsed: new Date()
            });
            console.log('✅ [Service] New token created successfully:', deviceToken._id);
            return deviceToken;
        });
    }
    /**
     * Unregister a device token
     */
    unregisterDeviceToken(deviceToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield notifications_model_1.UserDeviceToken.findOneAndUpdate({ deviceToken }, { isActive: false }, { new: true });
            return result;
        });
    }
    /**
     * Get user's device tokens
     */
    getUserDeviceTokens(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = yield notifications_model_1.UserDeviceToken.find({
                userId,
                isActive: true
            });
            return tokens;
        });
    }
    /**
     * Send test push notification
     */
    sendTestPushNotification(userId, notification) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendPushNotificationsToUsers([userId], notification);
        });
    }
}
exports.default = new NotificationService();
