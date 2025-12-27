import mongoose, { Document, Schema } from 'mongoose';

// Notification Interface
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'new_video' | 'channel_update' | 'system' | 'purchase' | 'like' | 'comment';
  title: string;
  message: string;
  data: {
    videoId?: mongoose.Types.ObjectId;
    channelId?: mongoose.Types.ObjectId;
    channelName?: string;
    videoTitle?: string;
    thumbnailUrl?: string;
    [key: string]: any;
  };
  isRead: boolean;
  isSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User Device Token Interface (for Firebase push notifications)
export interface IUserDeviceToken extends Document {
  userId: mongoose.Types.ObjectId;
  deviceToken: string;
  deviceType: 'android' | 'ios' | 'web';
  deviceInfo?: {
    model?: string;
    osVersion?: string;
    appVersion?: string;
  };
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Schema
const notificationSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['new_video', 'channel_update', 'system', 'purchase', 'like', 'comment'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    data: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    isSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// User Device Token Schema
const userDeviceTokenSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    deviceToken: {
      type: String,
      required: true,
      unique: true
    },
    deviceType: {
      type: String,
      enum: ['android', 'ios', 'web'],
      required: true
    },
    deviceInfo: {
      model: { type: String, default: '' },
      osVersion: { type: String, default: '' },
      appVersion: { type: String, default: '' }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes - removed duplicates
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

userDeviceTokenSchema.index({ userId: 1, isActive: 1 });

// Export models
export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export const UserDeviceToken = mongoose.model<IUserDeviceToken>('UserDeviceToken', userDeviceTokenSchema);
