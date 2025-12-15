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
exports.VideoLike = exports.WatchVideoCategory = exports.VideoWatchHistory = exports.VideoReview = exports.VideoPaymentTransaction = exports.VideoPurchase = exports.WatchVideo = exports.ChannelSubscription = exports.Channel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Country Pricing Schema - for country-wise pricing
const CountryPricingSchema = new mongoose_1.Schema({
    countryCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    countryName: {
        type: String,
        required: true,
        trim: true
    },
    currency: {
        type: String,
        required: true,
        uppercase: true,
        default: 'INR'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
});
// Episode Schema - for series/episodic content
const EpisodeSchema = new mongoose_1.Schema({
    episodeNumber: {
        type: Number,
        required: true,
        min: 1
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    videoUrl: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    duration: {
        type: Number, // in seconds
        required: true,
        min: 0
    },
    releaseDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    viewCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
// Season Schema - for organizing episodes
const SeasonSchema = new mongoose_1.Schema({
    seasonNumber: {
        type: Number,
        required: true,
        min: 1
    },
    title: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    episodes: [EpisodeSchema],
    releaseDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
// Channel Schema
const channelSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Channel name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    logoUrl: {
        type: String,
        default: ''
    },
    bannerUrl: {
        type: String,
        default: ''
    },
    ownerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ownerType: {
        type: String,
        enum: ['admin', 'vendor'],
        required: true
    },
    subscriberCount: {
        type: Number,
        default: 0
    },
    totalViews: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    socialLinks: {
        website: { type: String, default: '' },
        youtube: { type: String, default: '' },
        instagram: { type: String, default: '' },
        twitter: { type: String, default: '' },
        facebook: { type: String, default: '' }
    }
}, { timestamps: true });
// Channel Subscription Schema
const channelSubscriptionSchema = new mongoose_1.Schema({
    channelId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isNotificationEnabled: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
// Watch Video Schema
const watchVideoSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Video title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Video description is required']
    },
    channelId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Channel',
        required: [true, 'Channel is required']
    },
    videoType: {
        type: String,
        enum: ['single', 'series'],
        required: [true, 'Video type is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required']
    },
    categoryId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'WatchVideoCategory'
    },
    genres: [{
            type: String,
            trim: true
        }],
    languages: [{
            type: String,
            trim: true
        }],
    tags: [{
            type: String,
            trim: true
        }],
    // For single video
    videoUrl: {
        type: String,
        default: ''
    },
    trailerUrl: {
        type: String,
        default: ''
    },
    // For series
    seasons: [SeasonSchema],
    totalEpisodes: {
        type: Number,
        default: 0
    },
    // Media
    thumbnailUrl: {
        type: String,
        required: [true, 'Thumbnail is required']
    },
    posterUrl: {
        type: String,
        required: [true, 'Poster is required']
    },
    backdropUrl: {
        type: String,
        default: ''
    },
    galleryImages: [{
            type: String
        }],
    // Duration & Release
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: 0
    },
    releaseDate: {
        type: Date,
        required: [true, 'Release date is required']
    },
    // Pricing
    isFree: {
        type: Boolean,
        default: false
    },
    defaultPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    countryPricing: [CountryPricingSchema],
    // Ratings & Stats
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    likeCount: {
        type: Number,
        default: 0
    },
    // Certification & Age rating
    ageRating: {
        type: String,
        enum: ['U', 'UA', 'A', 'S', 'G', 'PG', 'PG-13', 'R', 'NC-17'],
        default: 'U'
    },
    certification: {
        type: String,
        default: ''
    },
    // Cast & Crew
    director: { type: String, default: '' },
    producer: { type: String, default: '' },
    cast: [{
            name: { type: String, required: true },
            role: { type: String, default: '' },
            image: { type: String, default: '' }
        }],
    crew: [{
            name: { type: String, required: true },
            designation: { type: String, default: '' },
            image: { type: String, default: '' }
        }],
    // Status
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    // Vendor/Admin ownership
    uploadedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedByType: {
        type: String,
        enum: ['admin', 'vendor'],
        required: true
    },
    // Home page section for Watch Movies
    homeSection: {
        type: String,
        enum: ['', 'trending_now', 'most_popular', 'exclusive_on_moviemart', 'new_release'],
        default: '',
    },
}, { timestamps: true });
// Video Purchase Schema - tracks user purchases
const videoPurchaseSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videoId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'WatchVideo',
        required: true
    },
    purchaseType: {
        type: String,
        enum: ['rent', 'buy'],
        default: 'buy'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'INR'
    },
    countryCode: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        default: 'cashfree'
    },
    transactionId: {
        type: String,
        required: true
    },
    purchaseReference: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date, // For rental purchases
        default: null
    },
    customerDetails: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true }
    },
    purchasedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
// Video Payment Transaction Schema
const videoPaymentTransactionSchema = new mongoose_1.Schema({
    purchaseId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'VideoPurchase',
        required: true
    },
    paymentGateway: {
        type: String,
        enum: ['cashfree', 'razorpay', 'stripe'],
        default: 'cashfree'
    },
    gatewayTransactionId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        default: ''
    },
    gatewayResponse: {
        type: mongoose_1.Schema.Types.Mixed
    },
    processedAt: {
        type: Date
    }
}, { timestamps: true });
// Video Rating/Review Schema
const videoReviewSchema = new mongoose_1.Schema({
    videoId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'WatchVideo',
        required: true
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    reviewText: {
        type: String,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    helpfulCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
// Video Watch History Schema
const videoWatchHistorySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videoId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'WatchVideo',
        required: true
    },
    episodeId: {
        type: String, // For series
        default: null
    },
    seasonNumber: {
        type: Number,
        default: null
    },
    episodeNumber: {
        type: Number,
        default: null
    },
    watchedDuration: {
        type: Number, // in seconds
        default: 0
    },
    totalDuration: {
        type: Number, // in seconds
        required: true
    },
    progress: {
        type: Number, // percentage 0-100
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    lastWatchedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
// Watch Video Category Schema
const watchVideoCategorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        default: ''
    },
    iconUrl: {
        type: String,
        default: ''
    },
    parentId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'WatchVideoCategory',
        default: null
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
// Video Like Schema
const videoLikeSchema = new mongoose_1.Schema({
    videoId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'WatchVideo',
        required: true
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });
// Indexes for better query performance
watchVideoSchema.index({ title: 'text', description: 'text', tags: 'text' });
watchVideoSchema.index({ channelId: 1 });
watchVideoSchema.index({ category: 1 });
watchVideoSchema.index({ categoryId: 1 });
watchVideoSchema.index({ genres: 1 });
watchVideoSchema.index({ languages: 1 });
watchVideoSchema.index({ releaseDate: -1 });
watchVideoSchema.index({ status: 1 });
watchVideoSchema.index({ isActive: 1 });
watchVideoSchema.index({ isFeatured: 1 });
watchVideoSchema.index({ viewCount: -1 });
watchVideoSchema.index({ averageRating: -1 });
watchVideoSchema.index({ uploadedBy: 1 });
watchVideoSchema.index({ homeSection: 1 });
channelSchema.index({ name: 'text', description: 'text' });
channelSchema.index({ ownerId: 1 });
channelSchema.index({ isActive: 1 });
channelSchema.index({ subscriberCount: -1 });
channelSubscriptionSchema.index({ channelId: 1, userId: 1 }, { unique: true });
videoPurchaseSchema.index({ userId: 1, videoId: 1 });
videoPurchaseSchema.index({ transactionId: 1 });
videoReviewSchema.index({ videoId: 1, userId: 1 }, { unique: true });
videoWatchHistorySchema.index({ userId: 1, videoId: 1 });
videoLikeSchema.index({ videoId: 1, userId: 1 }, { unique: true });
// Export models
exports.Channel = mongoose_1.default.model('Channel', channelSchema);
exports.ChannelSubscription = mongoose_1.default.model('ChannelSubscription', channelSubscriptionSchema);
exports.WatchVideo = mongoose_1.default.model('WatchVideo', watchVideoSchema);
exports.VideoPurchase = mongoose_1.default.model('VideoPurchase', videoPurchaseSchema);
exports.VideoPaymentTransaction = mongoose_1.default.model('VideoPaymentTransaction', videoPaymentTransactionSchema);
exports.VideoReview = mongoose_1.default.model('VideoReview', videoReviewSchema);
exports.VideoWatchHistory = mongoose_1.default.model('VideoWatchHistory', videoWatchHistorySchema);
exports.WatchVideoCategory = mongoose_1.default.model('WatchVideoCategory', watchVideoCategorySchema);
exports.VideoLike = mongoose_1.default.model('VideoLike', videoLikeSchema);
