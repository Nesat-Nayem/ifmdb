import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import notificationService from './notifications.service';
import { userInterface } from '../../middlewares/userInterface';

/**
 * Get user notifications
 */
const getUserNotifications = catchAsync(async (req: userInterface, res: Response) => {
  const userId = req.user?._id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const unreadOnly = req.query.unreadOnly === 'true';

  const result = await notificationService.getUserNotifications(userId, {
    page,
    limit,
    unreadOnly
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    data: result
  });
});

/**
 * Get unread notification count
 */
const getUnreadCount = catchAsync(async (req: userInterface, res: Response) => {
  const userId = req.user?._id;
  const count = await notificationService.getUnreadCount(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unread count retrieved successfully',
    data: { unreadCount: count }
  });
});

/**
 * Mark notification as read
 */
const markAsRead = catchAsync(async (req: userInterface, res: Response) => {
  const userId = req.user?._id;
  const { notificationId } = req.params;

  const notification = await notificationService.markAsRead(notificationId, userId);

  if (!notification) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Notification not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

/**
 * Mark all notifications as read
 */
const markAllAsRead = catchAsync(async (req: userInterface, res: Response) => {
  const userId = req.user?._id;
  const result = await notificationService.markAllAsRead(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All notifications marked as read',
    data: { modifiedCount: result.modifiedCount }
  });
});

/**
 * Delete a notification
 */
const deleteNotification = catchAsync(async (req: userInterface, res: Response) => {
  const userId = req.user?._id;
  const { notificationId } = req.params;

  const result = await notificationService.deleteNotification(notificationId, userId);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Notification not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification deleted successfully',
    data: null
  });
});

/**
 * Register device token for push notifications
 */
const registerDeviceToken = catchAsync(async (req: userInterface, res: Response) => {
  const userId = req.user?._id;
  const { deviceToken, deviceType, deviceInfo } = req.body;

  console.log('🔔 [FCM Registration] Request received');
  console.log('🔔 [FCM Registration] User ID:', userId);
  console.log('🔔 [FCM Registration] Device Token:', deviceToken?.substring(0, 20) + '...');
  console.log('🔔 [FCM Registration] Device Type:', deviceType);
  console.log('🔔 [FCM Registration] Device Info:', deviceInfo);

  if (!deviceToken || !deviceType) {
    console.log('❌ [FCM Registration] Missing required fields');
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Device token and device type are required',
      data: null
    });
  }

  const result = await notificationService.registerDeviceToken({
    userId,
    deviceToken,
    deviceType,
    deviceInfo
  });

  console.log('✅ [FCM Registration] Token registered successfully:', result._id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Device token registered successfully',
    data: result
  });
});

/**
 * Unregister device token
 */
const unregisterDeviceToken = catchAsync(async (req: userInterface, res: Response) => {
  const { deviceToken } = req.body;

  if (!deviceToken) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Device token is required',
      data: null
    });
  }

  const result = await notificationService.unregisterDeviceToken(deviceToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Device token unregistered successfully',
    data: result
  });
});

/**
 * Get user's device tokens
 */
const getUserDeviceTokens = catchAsync(async (req: userInterface, res: Response) => {
  const userId = req.user?._id;
  const tokens = await notificationService.getUserDeviceTokens(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Device tokens retrieved successfully',
    data: tokens
  });
});

/**
 * Send test push notification
 */
const sendTestPushNotification = catchAsync(async (req: userInterface, res: Response) => {
  const userId = req.user?._id;
  const { title, body, data } = req.body;

  if (!title || !body) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Title and body are required',
      data: null
    });
  }

  const sentCount = await notificationService.sendTestPushNotification(userId, {
    title,
    body,
    data
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Test notification sent to ${sentCount} device(s)`,
    data: { sentCount }
  });
});

export const NotificationController = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerDeviceToken,
  unregisterDeviceToken,
  getUserDeviceTokens,
  sendTestPushNotification
};
