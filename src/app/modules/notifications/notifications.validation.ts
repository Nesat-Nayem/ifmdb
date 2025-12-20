import { z } from 'zod';

export const registerDeviceTokenValidation = z.object({
  body: z.object({
    deviceToken: z.string().min(1, 'Device token is required'),
    deviceType: z.enum(['android', 'ios', 'web']),
    deviceInfo: z.object({
      model: z.string().optional(),
      osVersion: z.string().optional(),
      appVersion: z.string().optional()
    }).optional()
  })
});

export const unregisterDeviceTokenValidation = z.object({
  body: z.object({
    deviceToken: z.string().min(1, 'Device token is required')
  })
});

export const sendTestPushNotificationValidation = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    body: z.string().min(1, 'Body is required'),
    data: z.record(z.string(), z.any()).optional()
  })
});

export const NotificationValidation = {
  registerDeviceTokenValidation,
  unregisterDeviceTokenValidation,
  sendTestPushNotificationValidation
};
