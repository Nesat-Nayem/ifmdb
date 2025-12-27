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
exports.NotificationController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const notifications_service_1 = __importDefault(require("./notifications.service"));
/**
 * Get user notifications
 */
const getUserNotifications = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = yield notifications_service_1.default.getUserNotifications(userId, {
        page,
        limit,
        unreadOnly
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Notifications retrieved successfully',
        data: result
    });
}));
/**
 * Get unread notification count
 */
const getUnreadCount = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const count = yield notifications_service_1.default.getUnreadCount(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Unread count retrieved successfully',
        data: { unreadCount: count }
    });
}));
/**
 * Mark notification as read
 */
const markAsRead = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { notificationId } = req.params;
    const notification = yield notifications_service_1.default.markAsRead(notificationId, userId);
    if (!notification) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Notification not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Notification marked as read',
        data: notification
    });
}));
/**
 * Mark all notifications as read
 */
const markAllAsRead = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const result = yield notifications_service_1.default.markAllAsRead(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'All notifications marked as read',
        data: { modifiedCount: result.modifiedCount }
    });
}));
/**
 * Delete a notification
 */
const deleteNotification = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { notificationId } = req.params;
    const result = yield notifications_service_1.default.deleteNotification(notificationId, userId);
    if (!result) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Notification not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Notification deleted successfully',
        data: null
    });
}));
/**
 * Register device token for push notifications
 */
const registerDeviceToken = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { deviceToken, deviceType, deviceInfo } = req.body;
    console.log('🔔 [FCM Registration] Request received');
    console.log('🔔 [FCM Registration] User ID:', userId);
    console.log('🔔 [FCM Registration] Device Token:', (deviceToken === null || deviceToken === void 0 ? void 0 : deviceToken.substring(0, 20)) + '...');
    console.log('🔔 [FCM Registration] Device Type:', deviceType);
    console.log('🔔 [FCM Registration] Device Info:', deviceInfo);
    if (!deviceToken || !deviceType) {
        console.log('❌ [FCM Registration] Missing required fields');
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Device token and device type are required',
            data: null
        });
    }
    const result = yield notifications_service_1.default.registerDeviceToken({
        userId,
        deviceToken,
        deviceType,
        deviceInfo
    });
    console.log('✅ [FCM Registration] Token registered successfully:', result._id);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Device token registered successfully',
        data: result
    });
}));
/**
 * Unregister device token
 */
const unregisterDeviceToken = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deviceToken } = req.body;
    if (!deviceToken) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Device token is required',
            data: null
        });
    }
    const result = yield notifications_service_1.default.unregisterDeviceToken(deviceToken);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Device token unregistered successfully',
        data: result
    });
}));
/**
 * Get user's device tokens
 */
const getUserDeviceTokens = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const tokens = yield notifications_service_1.default.getUserDeviceTokens(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Device tokens retrieved successfully',
        data: tokens
    });
}));
/**
 * Send test push notification
 */
const sendTestPushNotification = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { title, body, data } = req.body;
    if (!title || !body) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Title and body are required',
            data: null
        });
    }
    const sentCount = yield notifications_service_1.default.sendTestPushNotification(userId, {
        title,
        body,
        data
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Test notification sent to ${sentCount} device(s)`,
        data: { sentCount }
    });
}));
exports.NotificationController = {
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
