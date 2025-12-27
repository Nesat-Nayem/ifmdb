import { Notification, INotification, UserDeviceToken } from './notifications.model';
import { ChannelSubscription } from '../watch-videos/watch-videos.model';
import mongoose from 'mongoose';
import admin from 'firebase-admin';

class NotificationService {
  /**
   * Create a notification for a user
   */
  async createNotification(data: {
    userId: mongoose.Types.ObjectId | string;
    type: INotification['type'];
    title: string;
    message: string;
    data?: any;
  }): Promise<INotification> {
    const notification = await Notification.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      isRead: false,
      isSent: false
    });

    return notification;
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(notifications: Array<{
    userId: mongoose.Types.ObjectId | string;
    type: INotification['type'];
    title: string;
    message: string;
    data?: any;
  }>): Promise<INotification[]> {
    const notificationDocs = notifications.map(notif => ({
      userId: notif.userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      data: notif.data || {},
      isRead: false,
      isSent: false
    }));

    const created = await Notification.insertMany(notificationDocs);
    return created as INotification[];
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string | mongoose.Types.ObjectId,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const query: any = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false })
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
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string | mongoose.Types.ObjectId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string | mongoose.Types.ObjectId) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    return result;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string | mongoose.Types.ObjectId) {
    const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
    return result;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string | mongoose.Types.ObjectId): Promise<number> {
    const count = await Notification.countDocuments({ userId, isRead: false });
    return count;
  }

  /**
   * Notify channel subscribers about new video
   */
  async notifyChannelSubscribers(data: {
    channelId: mongoose.Types.ObjectId | string;
    channelName: string;
    videoId: mongoose.Types.ObjectId | string;
    videoTitle: string;
    thumbnailUrl?: string;
  }) {
    // Get all subscribers with notifications enabled
    const subscriptions = await ChannelSubscription.find({
      channelId: data.channelId,
      isNotificationEnabled: true
    }).select('userId');

    if (subscriptions.length === 0) {
      return { notificationsSent: 0, pushNotificationsSent: 0 };
    }

    const userIds = subscriptions.map(sub => sub.userId as mongoose.Types.ObjectId);

    // Create in-app notifications
    const notifications = userIds.map(userId => ({
      userId,
      type: 'new_video' as const,
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

    await this.createBulkNotifications(notifications);

    // Send push notifications
    const pushNotificationsSent = await this.sendPushNotificationsToUsers(
      userIds,
      {
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
      }
    );

    return {
      notificationsSent: notifications.length,
      pushNotificationsSent
    };
  }

  /**
   * Send push notifications to multiple users
   */
  async sendPushNotificationsToUsers(
    userIds: Array<mongoose.Types.ObjectId | string>,
    notification: {
      title: string;
      body: string;
      data?: any;
      imageUrl?: string;
    }
  ): Promise<number> {
    try {
      // Check if Firebase is initialized
      if (!admin.apps.length) {
        console.warn('Firebase Admin SDK not initialized. Skipping push notifications.');
        return 0;
      }

      // Get all active device tokens for these users
      const deviceTokens = await UserDeviceToken.find({
        userId: { $in: userIds },
        isActive: true
      }).select('deviceToken deviceType');

      if (deviceTokens.length === 0) {
        return 0;
      }

      const tokens = deviceTokens.map(dt => dt.deviceToken);

      // Prepare the message
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: notification.data || {},
        tokens
      };

      // Send to all tokens
      const response = await admin.messaging().sendEachForMulticast(message);

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.error('Failed to send to token:', tokens[idx], resp.error);
          }
        });

        // Deactivate invalid tokens
        if (failedTokens.length > 0) {
          await UserDeviceToken.updateMany(
            { deviceToken: { $in: failedTokens } },
            { isActive: false }
          );
        }
      }

      return response.successCount;
    } catch (error) {
      console.error('Error sending push notifications:', error);
      return 0;
    }
  }

  /**
   * Register a device token for push notifications
   */
  async registerDeviceToken(data: {
    userId: mongoose.Types.ObjectId | string;
    deviceToken: string;
    deviceType: 'android' | 'ios' | 'web';
    deviceInfo?: {
      model?: string;
      osVersion?: string;
      appVersion?: string;
    };
  }) {
    console.log('🔔 [Service] Registering device token...');
    console.log('🔔 [Service] User ID:', data.userId);
    console.log('🔔 [Service] Device Type:', data.deviceType);
    
    // Check if token already exists
    const existing = await UserDeviceToken.findOne({ deviceToken: data.deviceToken });

    if (existing) {
      console.log('🔔 [Service] Token already exists, updating...');
      // Update existing token
      existing.userId = data.userId as mongoose.Types.ObjectId;
      existing.deviceType = data.deviceType;
      existing.deviceInfo = data.deviceInfo || existing.deviceInfo;
      existing.isActive = true;
      existing.lastUsed = new Date();
      await existing.save();
      console.log('✅ [Service] Token updated successfully:', existing._id);
      return existing;
    }

    console.log('🔔 [Service] Creating new token...');
    // Create new token
    const deviceToken = await UserDeviceToken.create({
      userId: data.userId,
      deviceToken: data.deviceToken,
      deviceType: data.deviceType,
      deviceInfo: data.deviceInfo || {},
      isActive: true,
      lastUsed: new Date()
    });

    console.log('✅ [Service] New token created successfully:', deviceToken._id);
    return deviceToken;
  }

  /**
   * Unregister a device token
   */
  async unregisterDeviceToken(deviceToken: string) {
    const result = await UserDeviceToken.findOneAndUpdate(
      { deviceToken },
      { isActive: false },
      { new: true }
    );
    return result;
  }

  /**
   * Get user's device tokens
   */
  async getUserDeviceTokens(userId: string | mongoose.Types.ObjectId) {
    const tokens = await UserDeviceToken.find({
      userId,
      isActive: true
    });
    return tokens;
  }

  /**
   * Send test push notification
   */
  async sendTestPushNotification(
    userId: string | mongoose.Types.ObjectId,
    notification: {
      title: string;
      body: string;
      data?: any;
    }
  ) {
    return this.sendPushNotificationsToUsers([userId], notification);
  }
}

export default new NotificationService();
