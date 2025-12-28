import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { userInterface } from '../../middlewares/userInterface';

// Import models
import Movie from '../movies/movies.model';
import Event from '../events/events.model';
import { EventBooking } from '../events/event-booking.model';
import { WatchVideo, VideoPurchase, Channel } from '../watch-videos/watch-videos.model';
import { Wallet, WalletTransaction, WithdrawalRequest } from '../wallet/wallet.model';
import { VendorApplication } from '../vendor/vendor.model';
import { User } from '../auth/auth.model';

/**
 * Get comprehensive dashboard stats
 * Admin sees full platform data, Vendor sees only their data
 */
const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  
  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const isAdmin = user.role === 'admin';
  const isVendor = user.role === 'vendor';
  const userId = user._id;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Build filter based on role
  const vendorFilter = isVendor ? { vendorId: userId } : {};

  // ==================== CONTENT COUNTS ====================
  const [
    totalMovies,
    totalEvents,
    totalWatchVideos,
    totalChannels,
    activeMovies,
    activeEvents,
    activeWatchVideos,
  ] = await Promise.all([
    Movie.countDocuments({ ...vendorFilter, isActive: true }),
    Event.countDocuments({ ...vendorFilter, isActive: true }),
    WatchVideo.countDocuments(isVendor ? { 'channelId': { $in: await Channel.find({ ownerId: userId }).distinct('_id') } } : { isActive: true }),
    Channel.countDocuments(isVendor ? { ownerId: userId } : {}),
    Movie.countDocuments({ ...vendorFilter, isActive: true, status: 'released' }),
    Event.countDocuments({ ...vendorFilter, isActive: true, status: { $in: ['upcoming', 'ongoing'] } }),
    WatchVideo.countDocuments(isVendor ? { 'channelId': { $in: await Channel.find({ ownerId: userId }).distinct('_id') }, isActive: true } : { isActive: true }),
  ]);

  // ==================== REVENUE DATA (ADMIN ONLY OR VENDOR'S OWN) ====================
  let revenueData: any = {};
  let transactionStats: any = {};

  if (isAdmin) {
    // Admin sees platform-wide revenue
    const [
      totalPlatformRevenue,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      eventBookingsRevenue,
      watchVideoRevenue,
    ] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: { type: 'platform_fee', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      WalletTransaction.aggregate([
        { $match: { type: 'platform_fee', status: 'completed', createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      WalletTransaction.aggregate([
        { $match: { type: 'platform_fee', status: 'completed', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      WalletTransaction.aggregate([
        { $match: { type: 'platform_fee', status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      WalletTransaction.aggregate([
        { $match: { type: 'platform_fee', status: 'completed', createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      EventBooking.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' }, count: { $sum: 1 } } }
      ]),
      VideoPurchase.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
    ]);

    revenueData = {
      totalPlatformRevenue: totalPlatformRevenue[0]?.total || 0,
      dailyRevenue: dailyRevenue[0]?.total || 0,
      weeklyRevenue: weeklyRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      yearlyRevenue: yearlyRevenue[0]?.total || 0,
      eventBookingsRevenue: eventBookingsRevenue[0]?.total || 0,
      eventBookingsCount: eventBookingsRevenue[0]?.count || 0,
      watchVideoRevenue: watchVideoRevenue[0]?.total || 0,
      watchVideoCount: watchVideoRevenue[0]?.count || 0,
    };
  } else if (isVendor) {
    // Vendor sees their own earnings
    const wallet = await Wallet.findOne({ userId });
    const [dailyEarnings, weeklyEarnings, monthlyEarnings] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), type: { $in: ['credit', 'pending_credit'] }, status: 'completed', createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } }
      ]),
      WalletTransaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), type: { $in: ['credit', 'pending_credit'] }, status: 'completed', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } }
      ]),
      WalletTransaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), type: { $in: ['credit', 'pending_credit'] }, status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } }
      ]),
    ]);

    revenueData = {
      walletBalance: wallet?.balance || 0,
      pendingBalance: wallet?.pendingBalance || 0,
      totalEarnings: wallet?.totalEarnings || 0,
      totalWithdrawn: wallet?.totalWithdrawn || 0,
      dailyEarnings: dailyEarnings[0]?.total || 0,
      weeklyEarnings: weeklyEarnings[0]?.total || 0,
      monthlyEarnings: monthlyEarnings[0]?.total || 0,
    };
  }

  // ==================== MONTHLY TREND DATA (Last 12 months) ====================
  const monthlyTrend = await WalletTransaction.aggregate([
    {
      $match: {
        type: isAdmin ? 'platform_fee' : { $in: ['credit', 'pending_credit'] },
        status: 'completed',
        createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
        ...(isVendor ? { userId: new mongoose.Types.ObjectId(userId) } : {})
      }
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: isAdmin ? '$amount' : '$netAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // ==================== VENDOR STATS (ADMIN ONLY) ====================
  let vendorStats: any = {};
  if (isAdmin) {
    const [
      totalVendors,
      pendingVendorApplications,
      approvedVendors,
      totalVendorPayouts,
      pendingWithdrawals,
    ] = await Promise.all([
      User.countDocuments({ role: 'vendor' }),
      VendorApplication.countDocuments({ status: 'pending' }),
      VendorApplication.countDocuments({ status: 'approved' }),
      WithdrawalRequest.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      WithdrawalRequest.countDocuments({ status: { $in: ['pending', 'processing'] } }),
    ]);

    vendorStats = {
      totalVendors,
      pendingVendorApplications,
      approvedVendors,
      totalVendorPayouts: totalVendorPayouts[0]?.total || 0,
      pendingWithdrawals,
    };
  }

  // ==================== RECENT TRANSACTIONS ====================
  let recentTransactions: any[] = [];
  if (isAdmin) {
    // Admin sees all platform fee transactions
    recentTransactions = await WalletTransaction.find({ type: 'platform_fee', status: 'completed' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  } else if (isVendor) {
    // Vendor sees their own transactions
    recentTransactions = await WalletTransaction.find({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  }

  // ==================== SERVICE BREAKDOWN ====================
  const serviceBreakdown = await WalletTransaction.aggregate([
    {
      $match: {
        type: isAdmin ? 'platform_fee' : { $in: ['credit', 'pending_credit'] },
        status: 'completed',
        ...(isVendor ? { userId: new mongoose.Types.ObjectId(userId) } : {})
      }
    },
    {
      $group: {
        _id: '$serviceType',
        total: { $sum: isAdmin ? '$amount' : '$netAmount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // ==================== DAILY TREND (Last 30 days) ====================
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyTrend = await WalletTransaction.aggregate([
    {
      $match: {
        type: isAdmin ? 'platform_fee' : { $in: ['credit', 'pending_credit'] },
        status: 'completed',
        createdAt: { $gte: thirtyDaysAgo },
        ...(isVendor ? { userId: new mongoose.Types.ObjectId(userId) } : {})
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: isAdmin ? '$amount' : '$netAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // ==================== USER/CUSTOMER STATS (ADMIN) ====================
  let userStats: any = {};
  if (isAdmin) {
    const [totalUsers, totalCustomers, newUsersToday, newUsersThisMonth] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    userStats = {
      totalUsers,
      totalCustomers,
      newUsersToday,
      newUsersThisMonth,
    };
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: {
      role: user.role,
      contentStats: {
        totalMovies,
        totalEvents,
        totalWatchVideos,
        totalChannels,
        activeMovies,
        activeEvents,
        activeWatchVideos,
      },
      revenueData,
      vendorStats,
      userStats,
      serviceBreakdown: serviceBreakdown.reduce((acc: any, item: any) => {
        acc[item._id || 'other'] = { total: item.total, count: item.count };
        return acc;
      }, {}),
      monthlyTrend,
      dailyTrend,
      recentTransactions,
    },
  });
});

/**
 * Get all platform transactions for admin
 */
const getAllTransactions = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  
  if (!user || user.role !== 'admin') {
    return sendResponse(res, {
      statusCode: httpStatus.FORBIDDEN,
      success: false,
      message: 'Admin access required',
      data: null,
    });
  }

  const {
    page = 1,
    limit = 20,
    type,
    serviceType,
    status,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};
  if (type) query.type = type;
  if (serviceType) query.serviceType = serviceType;
  if (status) query.status = status;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate as string);
    if (endDate) query.createdAt.$lte = new Date(endDate as string);
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (Number(page) - 1) * Number(limit);

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(query)
      .populate('userId', 'name email role')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    WalletTransaction.countDocuments(query)
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Transactions retrieved successfully',
    data: transactions,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

/**
 * Get watch video purchases/transactions
 */
const getVideoPurchases = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  
  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const isAdmin = user.role === 'admin';
  const isVendor = user.role === 'vendor';

  const {
    page = 1,
    limit = 20,
    paymentStatus,
    startDate,
    endDate,
    sortBy = 'purchasedAt',
    sortOrder = 'desc'
  } = req.query;

  let query: any = {};
  
  if (isVendor) {
    // Get vendor's channel IDs
    const vendorChannels = await Channel.find({ ownerId: user._id }).distinct('_id');
    // Get videos from vendor's channels
    const vendorVideos = await WatchVideo.find({ channelId: { $in: vendorChannels } }).distinct('_id');
    query.videoId = { $in: vendorVideos };
  }

  if (paymentStatus) query.paymentStatus = paymentStatus;
  
  if (startDate || endDate) {
    query.purchasedAt = {};
    if (startDate) query.purchasedAt.$gte = new Date(startDate as string);
    if (endDate) query.purchasedAt.$lte = new Date(endDate as string);
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (Number(page) - 1) * Number(limit);

  const [purchases, total, revenueData] = await Promise.all([
    VideoPurchase.find(query)
      .populate('videoId', 'title thumbnailUrl channelId')
      .populate('userId', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    VideoPurchase.countDocuments(query),
    VideoPurchase.aggregate([
      { $match: { ...query, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Video purchases retrieved successfully',
    data: purchases,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      totalRevenue: revenueData[0]?.total || 0
    }
  });
});

/**
 * Get vendor registrations and payments
 */
const getVendorRegistrations = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  
  if (!user || user.role !== 'admin') {
    return sendResponse(res, {
      statusCode: httpStatus.FORBIDDEN,
      success: false,
      message: 'Admin access required',
      data: null,
    });
  }

  const {
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};
  if (status) query.status = status;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate as string);
    if (endDate) query.createdAt.$lte = new Date(endDate as string);
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (Number(page) - 1) * Number(limit);

  const [applications, total] = await Promise.all([
    VendorApplication.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    VendorApplication.countDocuments(query)
  ]);

  // Get payment stats
  const paymentStats = await VendorApplication.aggregate([
    { $match: { 'paymentInfo.status': 'completed' } },
    { $group: { _id: null, total: { $sum: '$paymentInfo.amount' }, count: { $sum: 1 } } }
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor registrations retrieved successfully',
    data: applications,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      totalPayments: paymentStats[0]?.total || 0,
      paidCount: paymentStats[0]?.count || 0
    }
  });
});

export const DashboardController = {
  getDashboardStats,
  getAllTransactions,
  getVideoPurchases,
  getVendorRegistrations,
};
