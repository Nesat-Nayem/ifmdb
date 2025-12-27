"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDeviceToken = exports.Notification = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Notification Schema
const notificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed,
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
}, { timestamps: true });
// User Device Token Schema
const userDeviceTokenSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
}, { timestamps: true });
// Indexes - removed duplicates
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
userDeviceTokenSchema.index({ userId: 1, isActive: 1 });
// Export models
exports.Notification = mongoose_1.default.model('Notification', notificationSchema);
exports.UserDeviceToken = mongoose_1.default.model('UserDeviceToken', userDeviceTokenSchema);
