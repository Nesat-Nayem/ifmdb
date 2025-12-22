"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationValidation = exports.sendTestPushNotificationValidation = exports.unregisterDeviceTokenValidation = exports.registerDeviceTokenValidation = void 0;
const zod_1 = require("zod");
exports.registerDeviceTokenValidation = zod_1.z.object({
    body: zod_1.z.object({
        deviceToken: zod_1.z.string().min(1, 'Device token is required'),
        deviceType: zod_1.z.enum(['android', 'ios', 'web']),
        deviceInfo: zod_1.z.object({
            model: zod_1.z.string().optional(),
            osVersion: zod_1.z.string().optional(),
            appVersion: zod_1.z.string().optional()
        }).optional()
    })
});
exports.unregisterDeviceTokenValidation = zod_1.z.object({
    body: zod_1.z.object({
        deviceToken: zod_1.z.string().min(1, 'Device token is required')
    })
});
exports.sendTestPushNotificationValidation = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        body: zod_1.z.string().min(1, 'Body is required'),
        data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
    })
});
exports.NotificationValidation = {
    registerDeviceTokenValidation: exports.registerDeviceTokenValidation,
    unregisterDeviceTokenValidation: exports.unregisterDeviceTokenValidation,
    sendTestPushNotificationValidation: exports.sendTestPushNotificationValidation
};
