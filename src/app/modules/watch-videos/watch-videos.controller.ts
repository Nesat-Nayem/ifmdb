import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { userInterface } from '../../middlewares/userInterface';
import {
  WatchVideo,
  Channel,
  ChannelSubscription,
  WatchVideoCategory,
  VideoReview,
  VideoWatchHistory,
  VideoPurchase,
  VideoLike
} from './watch-videos.model';
import notificationService from '../notifications/notifications.service';
import videoExpiryScheduler from '../../schedulers/videoExpiryScheduler';

// ==================== DEEP LINK REDIRECT ====================

/**
 * Handle deep link redirects for mobile app
 * Redirects users to appropriate platform (Play Store/App Store) or web fallback
 */
const handleDeepLinkRedirect = catchAsync(async (req: Request, res: Response) => {
  const { id: videoId } = req.query;
  const userAgent = req.headers['user-agent'] || '';

  if (!videoId) {
    return res.redirect('/');
  }

  // Detect platform
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);

  // Check if video exists
  const video = await WatchVideo.findById(videoId);
  if (!video) {
    return res.redirect('/');
  }

  // For mobile platforms, redirect to smart redirect page
  if (isAndroid || isIOS) {
    return res.redirect(`/watch-movie-deatils/redirect?id=${videoId}`);
  }

  // For desktop/web, show video directly
  return res.redirect(`/watch-movie-deatils?id=${videoId}`);
});

// ==================== CHANNEL CONTROLLERS ====================

// Create Channel
const createChannel = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const channelData = req.body;
  
  const existingChannel = await Channel.findOne({ name: channelData.name });
  if (existingChannel) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Channel name already exists',
      data: null,
    });
  }

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const payload: any = { ...channelData };
  // Prevent spoofing ownership from client
  payload.ownerId = user._id;
  payload.ownerType = user.role === 'admin' ? 'admin' : 'vendor';

  // Vendors cannot self-verify channels
  if (user.role === 'vendor') {
    payload.isVerified = false;
  }
  
  const newChannel = await Channel.create(payload);
  
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Channel created successfully',
    data: newChannel,
  });
});

// Get All Channels
const getAllChannels = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const {
    page = 1,
    limit = 10,
    search,
    isActive,
    isVerified,
    sortBy = 'subscriberCount',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};

  // Only filter by vendor when explicitly requested (e.g., from admin panel)
  // Frontend should show all channels to everyone including vendors
  const { vendorOnly } = req.query;
  if (vendorOnly === 'true' && user && user.role === 'vendor') {
    query.ownerId = user._id;
  }

  if (search) {
    query.$text = { $search: search as string };
  }
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  if (isVerified !== undefined) {
    query.isVerified = isVerified === 'true';
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (Number(page) - 1) * Number(limit);
  
  const [channels, total] = await Promise.all([
    Channel.find(query)
      .populate('ownerId', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit)),
    Channel.countDocuments(query)
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Channels retrieved successfully',
    data: channels,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Get Channel by ID
const getChannelById = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { id } = req.params;
  
  const channel = await Channel.findById(id).populate('ownerId', 'name email');
  
  if (!channel) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Channel not found',
      data: null,
    });
  }

  // Vendors can only access their own channel
  if (user && user.role === 'vendor' && channel.ownerId && channel.ownerId.toString() !== user._id.toString()) {
    return sendResponse(res, {
      statusCode: httpStatus.FORBIDDEN,
      success: false,
      message: 'You are not allowed to access this channel',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Channel retrieved successfully',
    data: channel,
  });
});

// Update Channel
const updateChannel = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { id } = req.params;
  const updateData = req.body;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const existing = await Channel.findById(id);
  if (!existing) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Channel not found',
      data: null,
    });
  }

  // Vendors can only update their own channels
  if (user.role === 'vendor' && existing.ownerId.toString() !== user._id.toString()) {
    return sendResponse(res, {
      statusCode: httpStatus.FORBIDDEN,
      success: false,
      message: 'You are not allowed to update this channel',
      data: null,
    });
  }

  // Prevent ownership changes
  delete (updateData as any).ownerId;
  delete (updateData as any).ownerType;

  // Vendors cannot set verified
  if (user.role === 'vendor') {
    delete (updateData as any).isVerified;
  }

  const channel = await Channel.findByIdAndUpdate(id, updateData, { new: true });
  
  if (!channel) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Channel not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Channel updated successfully',
    data: channel,
  });
});

// Delete Channel
const deleteChannel = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { id } = req.params;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const existing = await Channel.findById(id);
  if (!existing) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Channel not found',
      data: null,
    });
  }

  // Vendors can only delete their own channels
  if (user.role === 'vendor' && existing.ownerId.toString() !== user._id.toString()) {
    return sendResponse(res, {
      statusCode: httpStatus.FORBIDDEN,
      success: false,
      message: 'You are not allowed to delete this channel',
      data: null,
    });
  }
  
  const channel = await Channel.findByIdAndUpdate(id, { isActive: false }, { new: true });
  
  if (!channel) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Channel not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Channel deleted successfully',
    data: channel,
  });
});

// Subscribe to Channel
const subscribeToChannel = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { channelId } = req.params;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const userId = user._id;

  const channel = await Channel.findById(channelId);
  if (!channel || !channel.isActive) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Channel not found',
      data: null,
    });
  }

  const existingSubscription = await ChannelSubscription.findOne({ channelId, userId });
  if (existingSubscription) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Already subscribed to this channel',
      data: null,
    });
  }

  const subscription = await ChannelSubscription.create({ channelId, userId, isNotificationEnabled: true });
  await Channel.findByIdAndUpdate(channelId, { $inc: { subscriberCount: 1 } });

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscribed successfully',
    data: subscription,
  });
});

// Unsubscribe from Channel
const unsubscribeFromChannel = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { channelId } = req.params;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const userId = user._id;

  const subscription = await ChannelSubscription.findOneAndDelete({ channelId, userId });
  if (!subscription) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Subscription not found',
      data: null,
    });
  }

  await Channel.findByIdAndUpdate(channelId, { $inc: { subscriberCount: -1 } });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unsubscribed successfully',
    data: null,
  });
});

// Toggle Notification for Subscription
const toggleNotification = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { channelId } = req.params;
  const { isNotificationEnabled } = req.body;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const userId = user._id;

  const subscription = await ChannelSubscription.findOneAndUpdate(
    { channelId, userId },
    { isNotificationEnabled },
    { new: true }
  );

  if (!subscription) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Subscription not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Notifications ${isNotificationEnabled ? 'enabled' : 'disabled'} successfully`,
    data: subscription,
  });
});

// Check Subscription Status
const checkSubscription = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { channelId } = req.params;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const userId = user._id;

  const subscription = await ChannelSubscription.findOne({ channelId, userId });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription status retrieved',
    data: { 
      isSubscribed: !!subscription,
      isNotificationEnabled: subscription?.isNotificationEnabled || false
    },
  });
});

// Get User's Subscribed Channels
const getUserSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const userId = user._id;

  const subscriptions = await ChannelSubscription.find({ userId })
    .populate('channelId')
    .sort({ createdAt: -1 });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User subscriptions retrieved',
    data: subscriptions.map(sub => sub.channelId),
  });
});

// ==================== WATCH VIDEO CONTROLLERS ====================

// Create Watch Video
const createWatchVideo = catchAsync(async (req: Request, res: Response) => {
  const videoData = req.body;

  // Verify channel exists
  const channel = await Channel.findById(videoData.channelId);
  if (!channel || !channel.isActive) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Channel not found',
      data: null,
    });
  }

  // Calculate total episodes for series
  if (videoData.videoType === 'series' && videoData.seasons) {
    videoData.totalEpisodes = videoData.seasons.reduce(
      (total: number, season: any) => total + (season.episodes?.length || 0),
      0
    );
  }

  const newVideo = await WatchVideo.create(videoData);

  // Notify channel subscribers about the new video
  try {
    await notificationService.notifyChannelSubscribers({
      channelId: channel._id as mongoose.Types.ObjectId,
      channelName: channel.name,
      videoId: newVideo._id as mongoose.Types.ObjectId,
      videoTitle: newVideo.title,
      thumbnailUrl: newVideo.thumbnailUrl
    });
  } catch (notifError) {
    console.error('Error sending notifications:', notifError);
    // Don't fail the video creation if notifications fail
  }

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Video created successfully',
    data: newVideo,
  });
});

// Get All Watch Videos
const getAllWatchVideos = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const {
    page = 1,
    limit = 10,
    search,
    category,
    categoryId,
    channelId,
    videoType,
    genre,
    language,
    status,
    isFree,
    isFeatured,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    uploadedBy
  } = req.query;

  const query: any = { isActive: true };

  // Only filter by vendor when explicitly requested (e.g., from admin panel)
  // Frontend should show all videos to everyone including vendors
  const { vendorOnly } = req.query;
  if (vendorOnly === 'true' && user && user.role === 'vendor') {
    query.uploadedBy = user._id;
  }

  // Visibility schedule filter - only for non-admin/vendor panel requests
  // Admin and vendors can see all their videos regardless of schedule
  const isAdminOrVendor = user && (user.role === 'admin' || user.role === 'vendor');
  if (!isAdminOrVendor) {
    const now = new Date();
    query.$or = [
      // Not scheduled videos
      { isScheduled: { $ne: true } },
      // Scheduled videos within visibility window
      {
        isScheduled: true,
        $and: [
          { $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }] },
          { $or: [{ visibleUntil: null }, { visibleUntil: { $gt: now } }] }
        ]
      }
    ];
  }

  if (search) {
    query.$text = { $search: search as string };
  }
  if (category) query.category = category;
  if (categoryId) query.categoryId = categoryId;
  if (channelId) query.channelId = channelId;
  if (videoType) query.videoType = videoType;
  if (genre) query.genres = { $in: [genre] };
  if (language) query.languages = { $in: [language] };
  if (status) query.status = status;
  if (isFree !== undefined) query.isFree = isFree === 'true';
  if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
  if (uploadedBy && (!user || user.role !== 'vendor')) query.uploadedBy = uploadedBy;
  
  if (minPrice || maxPrice) {
    query.defaultPrice = {};
    if (minPrice) query.defaultPrice.$gte = Number(minPrice);
    if (maxPrice) query.defaultPrice.$lte = Number(maxPrice);
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (Number(page) - 1) * Number(limit);

  const [videos, total] = await Promise.all([
    WatchVideo.find(query)
      .populate('channelId', 'name logoUrl isVerified')
      .populate('categoryId', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit)),
    WatchVideo.countDocuments(query)
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Videos retrieved successfully',
    data: videos,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Get Watch Video by ID
const getWatchVideoById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { countryCode } = req.query;
  const user = (req as userInterface).user;
  const isAdminOrVendor = user && (user.role === 'admin' || user.role === 'vendor');
  // Handle userId - filter out 'null', 'undefined', or empty strings
  const userId = req.query.userId && req.query.userId !== 'null' && req.query.userId !== 'undefined' 
    ? req.query.userId 
    : (user?._id || null);

  const video = await WatchVideo.findById(id)
    .populate('channelId', 'name logoUrl bannerUrl isVerified subscriberCount description')
    .populate('categoryId', 'name');

  if (!video || !video.isActive) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Video not found',
      data: null,
    });
  }

  // Check visibility schedule for public access
  const videoData = video as any;
  if (videoData.isScheduled) {
    const now = new Date();
    const visibleFrom = videoData.visibleFrom ? new Date(videoData.visibleFrom) : null;
    const visibleUntil = videoData.visibleUntil ? new Date(videoData.visibleUntil) : null;

    // Check if video is not yet visible
    if (visibleFrom && now < visibleFrom) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        success: false,
        message: `This video will be available from ${visibleFrom.toLocaleDateString()}`,
        data: { availableFrom: visibleFrom },
      });
    }

    // Check if video has expired
    if (visibleUntil && now > visibleUntil) {
      return sendResponse(res, {
        statusCode: httpStatus.GONE,
        success: false,
        message: 'This video is no longer available',
        data: { expiredAt: visibleUntil },
      });
    }
  }

  // Get price based on country
  let price = video.defaultPrice;
  let currency = 'INR';
  
  if (countryCode && video.countryPricing && video.countryPricing.length > 0) {
    const countryPrice = (video.countryPricing as any[]).find(
      (cp) => cp.countryCode === countryCode && cp.isActive
    );
    if (countryPrice) {
      price = countryPrice.price as number;
      currency = countryPrice.currency as string;
    }
  }

  // Check if user has purchased
  let hasPurchased = false;
  let isSubscribed = false;
  
  if (userId) {
    const purchase = await VideoPurchase.findOne({
      userId,
      videoId: id,
      paymentStatus: 'completed',
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    hasPurchased = !!purchase;

    const subscription = await ChannelSubscription.findOne({
      userId,
      channelId: video.channelId._id
    });
    isSubscribed = !!subscription;
  }

  // Increment view count
  await WatchVideo.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
  await Channel.findByIdAndUpdate(video.channelId._id, { $inc: { totalViews: 1 } });

  // SECURITY: Hide video URLs for paid content that user hasn't purchased
  // Users must use the /stream endpoint to get secure, time-limited URLs
  // Admin and vendor users always get full video URLs (needed for edit/manage)
  const videoObj = video.toObject() as any;
  const canWatch = video.isFree || hasPurchased;
  
  if (!canWatch && !isAdminOrVendor) {
    // Hide actual video URLs for unpurchased paid content (public users only)
    videoObj.videoUrl = null;
    videoObj.cloudflareVideoUid = null;
    // Also hide episode video URLs for series
    if (videoObj.seasons) {
      videoObj.seasons = videoObj.seasons.map((season: any) => ({
        ...season,
        episodes: season.episodes?.map((ep: any) => ({
          ...ep,
          videoUrl: null, // Hide episode video URL
        }))
      }));
    }
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video retrieved successfully',
    data: {
      ...videoObj,
      userPrice: price,
      userCurrency: currency,
      hasPurchased,
      isSubscribed,
      canWatch,
      // Indicate that secure streaming is required
      requiresSecureStream: !video.isFree,
    },
  });
});

// Update Watch Video
const updateWatchVideo = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Protect critical media fields from being accidentally wiped
  // Only update these fields if a non-empty value is explicitly provided
  const protectedMediaFields = ['videoUrl', 'trailerUrl', 'thumbnailUrl', 'posterUrl', 'cloudflareVideoUid', 'cloudflareTrailerUid'];
  for (const field of protectedMediaFields) {
    if (field in updateData && (updateData[field] === null || updateData[field] === undefined || updateData[field] === '')) {
      delete updateData[field];
    }
  }

  // Recalculate total episodes if seasons updated
  if (updateData.seasons) {
    updateData.totalEpisodes = updateData.seasons.reduce(
      (total: number, season: any) => total + (season.episodes?.length || 0),
      0
    );
  }

  const video = await WatchVideo.findByIdAndUpdate(id, updateData, { new: true });

  if (!video) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Video not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video updated successfully',
    data: video,
  });
});

// Delete Watch Video
const deleteWatchVideo = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const video = await WatchVideo.findByIdAndUpdate(
    id,
    { isActive: false, status: 'archived' },
    { new: true }
  );

  if (!video) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Video not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video deleted successfully',
    data: video,
  });
});

// Get Featured Videos
const getFeaturedVideos = catchAsync(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;

  const videos = await WatchVideo.find({
    isActive: true,
    status: 'published',
    isFeatured: true
  })
    .populate('channelId', 'name logoUrl isVerified')
    .sort({ viewCount: -1 })
    .limit(Number(limit));

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Featured videos retrieved',
    data: videos,
  });
});

// Get Trending Videos
const getTrendingVideos = catchAsync(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;

  // Get videos with most views in last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const videos = await WatchVideo.find({
    isActive: true,
    status: 'published',
    updatedAt: { $gte: weekAgo }
  })
    .populate('channelId', 'name logoUrl isVerified')
    .sort({ viewCount: -1 })
    .limit(Number(limit));

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trending videos retrieved',
    data: videos,
  });
});

// Get Videos by Channel
const getVideosByChannel = catchAsync(async (req: Request, res: Response) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [videos, total] = await Promise.all([
    WatchVideo.find({
      channelId,
      isActive: true,
      status: 'published'
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    WatchVideo.countDocuments({
      channelId,
      isActive: true,
      status: 'published'
    })
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Channel videos retrieved',
    data: videos,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Get Recommended Videos
const getRecommendedVideos = catchAsync(async (req: Request, res: Response) => {
  const { videoId, limit = 10 } = req.query;

  let query: any = {
    isActive: true,
    status: 'published'
  };

  if (videoId) {
    const currentVideo = await WatchVideo.findById(videoId);
    if (currentVideo) {
      query.$or = [
        { genres: { $in: currentVideo.genres } },
        { category: currentVideo.category },
        { channelId: currentVideo.channelId }
      ];
      query._id = { $ne: videoId };
    }
  }

  const videos = await WatchVideo.find(query)
    .populate('channelId', 'name logoUrl isVerified')
    .sort({ viewCount: -1, averageRating: -1 })
    .limit(Number(limit));

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Recommended videos retrieved',
    data: videos,
  });
});

// ==================== EPISODE CONTROLLERS ====================

// Add Episode to Season
const addEpisode = catchAsync(async (req: Request, res: Response) => {
  const { videoId, seasonNumber } = req.params;
  const episodeData = req.body;

  const video = await WatchVideo.findById(videoId);
  if (!video || video.videoType !== 'series') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Video not found or not a series',
      data: null,
    });
  }

  const seasonIndex = video.seasons?.findIndex(
    (s: any) => s.seasonNumber === Number(seasonNumber)
  );

  if (seasonIndex === undefined || seasonIndex === -1) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Season not found',
      data: null,
    });
  }

  (video.seasons![seasonIndex] as any).episodes.push(episodeData);
  video.totalEpisodes = video.seasons!.reduce(
    (total: number, season: any) => total + season.episodes.length,
    0
  );

  await video.save();

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Episode added successfully',
    data: video,
  });
});

// Add Season
const addSeason = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const seasonData = req.body;

  const video = await WatchVideo.findById(videoId);
  if (!video || video.videoType !== 'series') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Video not found or not a series',
      data: null,
    });
  }

  if (!video.seasons) video.seasons = [];
  video.seasons.push(seasonData);
  await video.save();

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Season added successfully',
    data: video,
  });
});

// ==================== CATEGORY CONTROLLERS ====================

// Create Category
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryData = { ...req.body };

  // Clean up empty string values that should be null or undefined
  if (categoryData.parentId === '' || categoryData.parentId === null) {
    delete categoryData.parentId;
  }
  if (categoryData.imageUrl === '') {
    delete categoryData.imageUrl;
  }
  if (categoryData.iconUrl === '') {
    delete categoryData.iconUrl;
  }
  if (categoryData.description === '') {
    delete categoryData.description;
  }

  const existingCategory = await WatchVideoCategory.findOne({ name: categoryData.name });
  if (existingCategory) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Category already exists',
      data: null,
    });
  }

  const category = await WatchVideoCategory.create(categoryData);

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

// Get All Categories
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await WatchVideoCategory.find({ isActive: true })
    .sort({ order: 1, name: 1 });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    data: categories,
  });
});

// Update Category
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Clean up empty string values that should be null or undefined
  if (updateData.parentId === '' || updateData.parentId === null) {
    updateData.parentId = null; // Set to null to clear the parent
  }
  if (updateData.imageUrl === '') {
    delete updateData.imageUrl;
  }
  if (updateData.iconUrl === '') {
    delete updateData.iconUrl;
  }

  const category = await WatchVideoCategory.findByIdAndUpdate(id, updateData, { new: true });

  if (!category) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Category not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

// Delete Category
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await WatchVideoCategory.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!category) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Category not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully',
    data: category,
  });
});

// ==================== REVIEW & RATING CONTROLLERS ====================

// Add/Update Review
const addReview = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const { userId, rating, reviewText } = req.body;

  // Check if user has purchased the video
  const hasPurchased = await VideoPurchase.findOne({
    userId,
    videoId,
    paymentStatus: 'completed'
  });

  const video = await WatchVideo.findById(videoId);
  if (!video) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Video not found',
      data: null,
    });
  }

  // Upsert review
  const review = await VideoReview.findOneAndUpdate(
    { videoId, userId },
    { rating, reviewText, isVerified: !!hasPurchased },
    { upsert: true, new: true }
  );

  // Recalculate average rating
  const allReviews = await VideoReview.find({ videoId });
  const avgRating = allReviews.reduce((sum, r: any) => sum + r.rating, 0) / allReviews.length;

  await WatchVideo.findByIdAndUpdate(videoId, {
    averageRating: avgRating,
    totalRatings: allReviews.length
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review submitted successfully',
    data: review,
  });
});

// Get Video Reviews
const getVideoReviews = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    VideoReview.find({ videoId })
      .populate('userId', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VideoReview.countDocuments({ videoId })
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reviews retrieved successfully',
    data: reviews,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// ==================== LIKE CONTROLLERS ====================

// Toggle Like
const toggleLike = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const { userId } = req.body;

  const existingLike = await VideoLike.findOne({ videoId, userId });

  if (existingLike) {
    await VideoLike.deleteOne({ _id: existingLike._id });
    const video = await WatchVideo.findByIdAndUpdate(
      videoId, 
      { $inc: { likeCount: -1 } },
      { new: true }
    );

    const newLikeCount = Math.max(0, video?.likeCount || 0);
    if (video && video.likeCount < 0) {
      await WatchVideo.findByIdAndUpdate(videoId, { likeCount: 0 });
    }

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Like removed',
      data: { liked: false, likeCount: newLikeCount },
    });
  } else {
    await VideoLike.create({ videoId, userId });
    const video = await WatchVideo.findByIdAndUpdate(
      videoId, 
      { $inc: { likeCount: 1 } },
      { new: true }
    );

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Video liked',
      data: { liked: true, likeCount: video?.likeCount || 1 },
    });
  }
});

// Check Like Status
const checkLikeStatus = catchAsync(async (req: Request, res: Response) => {
  const { videoId, userId } = req.params;

  const like = await VideoLike.findOne({ videoId, userId });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Like status retrieved',
    data: { liked: !!like },
  });
});

// ==================== WATCH HISTORY CONTROLLERS ====================

// Update Watch Progress
const updateWatchProgress = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const {
    userId,
    watchedDuration,
    totalDuration,
    episodeId,
    seasonNumber,
    episodeNumber
  } = req.body;

  const progress = Math.round((watchedDuration / totalDuration) * 100);
  const isCompleted = progress >= 90;

  const history = await VideoWatchHistory.findOneAndUpdate(
    { userId, videoId, episodeId: episodeId || null },
    {
      watchedDuration,
      totalDuration,
      progress,
      isCompleted,
      seasonNumber,
      episodeNumber,
      lastWatchedAt: new Date()
    },
    { upsert: true, new: true }
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Watch progress updated',
    data: history,
  });
});

// Get Watch History
const getWatchHistory = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [history, total] = await Promise.all([
    VideoWatchHistory.find({ userId })
      .populate('videoId', 'title thumbnailUrl duration videoType')
      .sort({ lastWatchedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VideoWatchHistory.countDocuments({ userId })
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Watch history retrieved',
    data: history,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Get Continue Watching
const getContinueWatching = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit = 10 } = req.query;

  const history = await VideoWatchHistory.find({
    userId,
    isCompleted: false,
    progress: { $gt: 0, $lt: 90 }
  })
    .populate('videoId', 'title thumbnailUrl posterUrl duration videoType channelId')
    .sort({ lastWatchedAt: -1 })
    .limit(Number(limit));

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Continue watching list retrieved',
    data: history,
  });
});

// ==================== USER PURCHASES ====================

// Get User's Purchased Videos
const getUserPurchases = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [purchases, total] = await Promise.all([
    VideoPurchase.find({
      userId,
      paymentStatus: 'completed',
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
      .populate('videoId', 'title thumbnailUrl posterUrl duration videoType')
      .sort({ purchasedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VideoPurchase.countDocuments({
      userId,
      paymentStatus: 'completed'
    })
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User purchases retrieved',
    data: purchases,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Check if user has access to video
const checkVideoAccess = catchAsync(async (req: Request, res: Response) => {
  const { videoId, userId } = req.params;

  const video = await WatchVideo.findById(videoId);
  if (!video) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Video not found',
      data: null,
    });
  }

  if (video.isFree) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Video is free to watch',
      data: { hasAccess: true, reason: 'free' },
    });
  }

  const purchase = await VideoPurchase.findOne({
    userId,
    videoId,
    paymentStatus: 'completed',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Access status retrieved',
    data: {
      hasAccess: !!purchase,
      reason: purchase ? 'purchased' : 'not_purchased',
      purchase: purchase || null
    },
  });
});

// ==================== SECURE VIDEO STREAMING ====================

// Generate secure signed token for video streaming
const generateStreamToken = (videoId: string, userId: string, expiresInMinutes: number = 60): string => {
  const payload = {
    videoId,
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (expiresInMinutes * 60),
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(payload, secret);
};

// Verify stream token
const verifyStreamToken = (token: string): { valid: boolean; payload?: any; error?: string } => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = jwt.verify(token, secret);
    return { valid: true, payload };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
};

// Get secure video stream URL (only for authorized users)
const getSecureVideoStream = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const { userId, token } = req.query;

  if (!videoId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Video ID is required',
      data: null,
    });
  }

  // Find the video
  const video = await WatchVideo.findById(videoId);
  if (!video || !video.isActive) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Video not found',
      data: null,
    });
  }

  // If video is free, generate stream token and return URL
  if (video.isFree) {
    const streamToken = generateStreamToken(videoId, userId as string || 'anonymous', 60);
    
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Stream URL generated',
      data: {
        streamUrl: video.videoUrl,
        streamToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        isSecured: true,
      },
    });
  }

  // For paid videos, verify user has purchased
  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Authentication required to access this video',
      data: null,
    });
  }

  // Check if user has valid purchase
  const purchase = await VideoPurchase.findOne({
    userId,
    videoId,
    paymentStatus: 'completed',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });

  if (!purchase) {
    return sendResponse(res, {
      statusCode: httpStatus.FORBIDDEN,
      success: false,
      message: 'You need to purchase this video to watch',
      data: { requiresPurchase: true },
    });
  }

  // Generate secure stream token
  const streamToken = generateStreamToken(videoId, userId as string, 60);

  // For Cloudflare Stream videos, we can use their signed URLs feature
  // For regular videos, return the URL with our signed token
  const videoData = video as any;
  
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stream URL generated',
    data: {
      streamUrl: videoData.videoUrl,
      streamToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      isSecured: true,
      cloudflareVideoUid: videoData.cloudflareVideoUid || null,
    },
  });
});

// Verify stream access (middleware endpoint for video proxy)
const verifyStreamAccess = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Stream token is required',
      data: null,
    });
  }

  const verification = verifyStreamToken(token as string);
  
  if (!verification.valid) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Invalid or expired stream token',
      data: { error: verification.error },
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stream access verified',
    data: {
      videoId: verification.payload.videoId,
      userId: verification.payload.userId,
      expiresAt: new Date(verification.payload.exp * 1000).toISOString(),
    },
  });
});

// ==================== VIDEO EXPIRY MANAGEMENT (Admin) ====================

// Get scheduled/expiring videos
const getScheduledVideos = catchAsync(async (req: Request, res: Response) => {
  const { status, daysAhead = 7 } = req.query;
  const now = new Date();

  let query: any = { isScheduled: true, isActive: true };

  if (status === 'upcoming') {
    // Videos that will become visible in the future
    query.visibleFrom = { $gt: now };
  } else if (status === 'expiring') {
    // Videos expiring soon
    const futureDate = new Date(now.getTime() + Number(daysAhead) * 24 * 60 * 60 * 1000);
    query.visibleUntil = { $gte: now, $lte: futureDate };
  } else if (status === 'expired') {
    // Already expired videos
    query.visibleUntil = { $lt: now };
  }

  const videos = await WatchVideo.find(query)
    .select('title thumbnailUrl visibleFrom visibleUntil autoDeleteOnExpiry status createdAt')
    .sort({ visibleUntil: 1 });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Scheduled videos retrieved',
    data: videos,
  });
});

// Manually process expired videos
const processExpiredVideosManually = catchAsync(async (req: Request, res: Response) => {
  const result = await videoExpiryScheduler.processExpiredContent();

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Expired videos processed',
    data: result,
  });
});

// Get upcoming expiring videos for dashboard
const getUpcomingExpiringVideos = catchAsync(async (req: Request, res: Response) => {
  const { daysAhead = 7 } = req.query;

  const videos = await videoExpiryScheduler.getUpcomingExpiringContent(Number(daysAhead));

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Upcoming expiring videos retrieved',
    data: videos,
  });
});

export const WatchVideoController = {
  // Channel
  createChannel,
  getAllChannels,
  getChannelById,
  updateChannel,
  deleteChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
  toggleNotification,
  checkSubscription,
  getUserSubscriptions,
  
  // Watch Videos
  createWatchVideo,
  getAllWatchVideos,
  getWatchVideoById,
  updateWatchVideo,
  deleteWatchVideo,
  getFeaturedVideos,
  getTrendingVideos,
  getVideosByChannel,
  getRecommendedVideos,
  
  // Episodes & Seasons
  addEpisode,
  addSeason,
  
  // Categories
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  
  // Reviews
  addReview,
  getVideoReviews,
  
  // Likes
  toggleLike,
  checkLikeStatus,
  
  // Watch History
  updateWatchProgress,
  getWatchHistory,
  getContinueWatching,
  
  // Purchases
  getUserPurchases,
  checkVideoAccess,
  
  // Deep Link Redirect
  handleDeepLinkRedirect,
  
  // Video Expiry Management (Admin)
  getScheduledVideos,
  processExpiredVideosManually,
  getUpcomingExpiringVideos,
  
  // Secure Video Streaming
  getSecureVideoStream,
  verifyStreamAccess,
};
