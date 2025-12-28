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
exports.DashboardController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
// Import models
const movies_model_1 = __importDefault(require("../movies/movies.model"));
const events_model_1 = __importDefault(require("../events/events.model"));
const event_booking_model_1 = require("../events/event-booking.model");
const watch_videos_model_1 = require("../watch-videos/watch-videos.model");
const wallet_model_1 = require("../wallet/wallet.model");
const vendor_model_1 = require("../vendor/vendor.model");
const auth_model_1 = require("../auth/auth.model");
/**
 * Get comprehensive dashboard stats
 * Admin sees full platform data, Vendor sees only their data
 */
const getDashboardStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const user = req.user;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
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
    const [totalMovies, totalEvents, totalWatchVideos, totalChannels, activeMovies, activeEvents, activeWatchVideos,] = yield Promise.all([
        movies_model_1.default.countDocuments(Object.assign(Object.assign({}, vendorFilter), { isActive: true })),
        events_model_1.default.countDocuments(Object.assign(Object.assign({}, vendorFilter), { isActive: true })),
        watch_videos_model_1.WatchVideo.countDocuments(isVendor ? { 'channelId': { $in: yield watch_videos_model_1.Channel.find({ ownerId: userId }).distinct('_id') } } : { isActive: true }),
        watch_videos_model_1.Channel.countDocuments(isVendor ? { ownerId: userId } : {}),
        movies_model_1.default.countDocuments(Object.assign(Object.assign({}, vendorFilter), { isActive: true, status: 'released' })),
        events_model_1.default.countDocuments(Object.assign(Object.assign({}, vendorFilter), { isActive: true, status: { $in: ['upcoming', 'ongoing'] } })),
        watch_videos_model_1.WatchVideo.countDocuments(isVendor ? { 'channelId': { $in: yield watch_videos_model_1.Channel.find({ ownerId: userId }).distinct('_id') }, isActive: true } : { isActive: true }),
    ]);
    // ==================== REVENUE DATA (ADMIN ONLY OR VENDOR'S OWN) ====================
    let revenueData = {};
    let transactionStats = {};
    if (isAdmin) {
        // Admin sees platform-wide revenue
        const [totalPlatformRevenue, dailyRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue, eventBookingsRevenue, watchVideoRevenue,] = yield Promise.all([
            wallet_model_1.WalletTransaction.aggregate([
                { $match: { type: 'platform_fee', status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            wallet_model_1.WalletTransaction.aggregate([
                { $match: { type: 'platform_fee', status: 'completed', createdAt: { $gte: startOfDay } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            wallet_model_1.WalletTransaction.aggregate([
                { $match: { type: 'platform_fee', status: 'completed', createdAt: { $gte: startOfWeek } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            wallet_model_1.WalletTransaction.aggregate([
                { $match: { type: 'platform_fee', status: 'completed', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            wallet_model_1.WalletTransaction.aggregate([
                { $match: { type: 'platform_fee', status: 'completed', createdAt: { $gte: startOfYear } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            event_booking_model_1.EventBooking.aggregate([
                { $match: { paymentStatus: 'completed' } },
                { $group: { _id: null, total: { $sum: '$finalAmount' }, count: { $sum: 1 } } }
            ]),
            watch_videos_model_1.VideoPurchase.aggregate([
                { $match: { paymentStatus: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
        ]);
        revenueData = {
            totalPlatformRevenue: ((_a = totalPlatformRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
            dailyRevenue: ((_b = dailyRevenue[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
            weeklyRevenue: ((_c = weeklyRevenue[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
            monthlyRevenue: ((_d = monthlyRevenue[0]) === null || _d === void 0 ? void 0 : _d.total) || 0,
            yearlyRevenue: ((_e = yearlyRevenue[0]) === null || _e === void 0 ? void 0 : _e.total) || 0,
            eventBookingsRevenue: ((_f = eventBookingsRevenue[0]) === null || _f === void 0 ? void 0 : _f.total) || 0,
            eventBookingsCount: ((_g = eventBookingsRevenue[0]) === null || _g === void 0 ? void 0 : _g.count) || 0,
            watchVideoRevenue: ((_h = watchVideoRevenue[0]) === null || _h === void 0 ? void 0 : _h.total) || 0,
            watchVideoCount: ((_j = watchVideoRevenue[0]) === null || _j === void 0 ? void 0 : _j.count) || 0,
        };
    }
    else if (isVendor) {
        // Vendor sees their own earnings
        const wallet = yield wallet_model_1.Wallet.findOne({ userId });
        const [dailyEarnings, weeklyEarnings, monthlyEarnings] = yield Promise.all([
            wallet_model_1.WalletTransaction.aggregate([
                { $match: { userId: new mongoose_1.default.Types.ObjectId(userId), type: { $in: ['credit', 'pending_credit'] }, status: 'completed', createdAt: { $gte: startOfDay } } },
                { $group: { _id: null, total: { $sum: '$netAmount' } } }
            ]),
            wallet_model_1.WalletTransaction.aggregate([
                { $match: { userId: new mongoose_1.default.Types.ObjectId(userId), type: { $in: ['credit', 'pending_credit'] }, status: 'completed', createdAt: { $gte: startOfWeek } } },
                { $group: { _id: null, total: { $sum: '$netAmount' } } }
            ]),
            wallet_model_1.WalletTransaction.aggregate([
                { $match: { userId: new mongoose_1.default.Types.ObjectId(userId), type: { $in: ['credit', 'pending_credit'] }, status: 'completed', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$netAmount' } } }
            ]),
        ]);
        revenueData = {
            walletBalance: (wallet === null || wallet === void 0 ? void 0 : wallet.balance) || 0,
            pendingBalance: (wallet === null || wallet === void 0 ? void 0 : wallet.pendingBalance) || 0,
            totalEarnings: (wallet === null || wallet === void 0 ? void 0 : wallet.totalEarnings) || 0,
            totalWithdrawn: (wallet === null || wallet === void 0 ? void 0 : wallet.totalWithdrawn) || 0,
            dailyEarnings: ((_k = dailyEarnings[0]) === null || _k === void 0 ? void 0 : _k.total) || 0,
            weeklyEarnings: ((_l = weeklyEarnings[0]) === null || _l === void 0 ? void 0 : _l.total) || 0,
            monthlyEarnings: ((_m = monthlyEarnings[0]) === null || _m === void 0 ? void 0 : _m.total) || 0,
        };
    }
    // ==================== MONTHLY TREND DATA (Last 12 months) ====================
    const monthlyTrend = yield wallet_model_1.WalletTransaction.aggregate([
        {
            $match: Object.assign({ type: isAdmin ? 'platform_fee' : { $in: ['credit', 'pending_credit'] }, status: 'completed', createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } }, (isVendor ? { userId: new mongoose_1.default.Types.ObjectId(userId) } : {}))
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
    let vendorStats = {};
    if (isAdmin) {
        const [totalVendors, pendingVendorApplications, approvedVendors, totalVendorPayouts, pendingWithdrawals,] = yield Promise.all([
            auth_model_1.User.countDocuments({ role: 'vendor' }),
            vendor_model_1.VendorApplication.countDocuments({ status: 'pending' }),
            vendor_model_1.VendorApplication.countDocuments({ status: 'approved' }),
            wallet_model_1.WithdrawalRequest.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            wallet_model_1.WithdrawalRequest.countDocuments({ status: { $in: ['pending', 'processing'] } }),
        ]);
        vendorStats = {
            totalVendors,
            pendingVendorApplications,
            approvedVendors,
            totalVendorPayouts: ((_o = totalVendorPayouts[0]) === null || _o === void 0 ? void 0 : _o.total) || 0,
            pendingWithdrawals,
        };
    }
    // ==================== RECENT TRANSACTIONS ====================
    let recentTransactions = [];
    if (isAdmin) {
        // Admin sees all platform fee transactions
        recentTransactions = yield wallet_model_1.WalletTransaction.find({ type: 'platform_fee', status: 'completed' })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
    }
    else if (isVendor) {
        // Vendor sees their own transactions
        recentTransactions = yield wallet_model_1.WalletTransaction.find({ userId, status: 'completed' })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
    }
    // ==================== SERVICE BREAKDOWN ====================
    const serviceBreakdown = yield wallet_model_1.WalletTransaction.aggregate([
        {
            $match: Object.assign({ type: isAdmin ? 'platform_fee' : { $in: ['credit', 'pending_credit'] }, status: 'completed' }, (isVendor ? { userId: new mongoose_1.default.Types.ObjectId(userId) } : {}))
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
    const dailyTrend = yield wallet_model_1.WalletTransaction.aggregate([
        {
            $match: Object.assign({ type: isAdmin ? 'platform_fee' : { $in: ['credit', 'pending_credit'] }, status: 'completed', createdAt: { $gte: thirtyDaysAgo } }, (isVendor ? { userId: new mongoose_1.default.Types.ObjectId(userId) } : {}))
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
    let userStats = {};
    if (isAdmin) {
        const [totalUsers, totalCustomers, newUsersToday, newUsersThisMonth] = yield Promise.all([
            auth_model_1.User.countDocuments({}),
            auth_model_1.User.countDocuments({ role: 'user' }),
            auth_model_1.User.countDocuments({ createdAt: { $gte: startOfDay } }),
            auth_model_1.User.countDocuments({ createdAt: { $gte: startOfMonth } }),
        ]);
        userStats = {
            totalUsers,
            totalCustomers,
            newUsersToday,
            newUsersThisMonth,
        };
    }
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
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
            serviceBreakdown: serviceBreakdown.reduce((acc, item) => {
                acc[item._id || 'other'] = { total: item.total, count: item.count };
                return acc;
            }, {}),
            monthlyTrend,
            dailyTrend,
            recentTransactions,
        },
    });
}));
/**
 * Get all platform transactions for admin
 */
const getAllTransactions = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user || user.role !== 'admin') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.FORBIDDEN,
            success: false,
            message: 'Admin access required',
            data: null,
        });
    }
    const { page = 1, limit = 20, type, serviceType, status, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (type)
        query.type = type;
    if (serviceType)
        query.serviceType = serviceType;
    if (status)
        query.status = status;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate)
            query.createdAt.$gte = new Date(startDate);
        if (endDate)
            query.createdAt.$lte = new Date(endDate);
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = yield Promise.all([
        wallet_model_1.WalletTransaction.find(query)
            .populate('userId', 'name email role')
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        wallet_model_1.WalletTransaction.countDocuments(query)
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
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
}));
/**
 * Get watch video purchases/transactions
 */
const getVideoPurchases = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const isAdmin = user.role === 'admin';
    const isVendor = user.role === 'vendor';
    const { page = 1, limit = 20, paymentStatus, startDate, endDate, sortBy = 'purchasedAt', sortOrder = 'desc' } = req.query;
    let query = {};
    if (isVendor) {
        // Get vendor's channel IDs
        const vendorChannels = yield watch_videos_model_1.Channel.find({ ownerId: user._id }).distinct('_id');
        // Get videos from vendor's channels
        const vendorVideos = yield watch_videos_model_1.WatchVideo.find({ channelId: { $in: vendorChannels } }).distinct('_id');
        query.videoId = { $in: vendorVideos };
    }
    if (paymentStatus)
        query.paymentStatus = paymentStatus;
    if (startDate || endDate) {
        query.purchasedAt = {};
        if (startDate)
            query.purchasedAt.$gte = new Date(startDate);
        if (endDate)
            query.purchasedAt.$lte = new Date(endDate);
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (Number(page) - 1) * Number(limit);
    const [purchases, total, revenueData] = yield Promise.all([
        watch_videos_model_1.VideoPurchase.find(query)
            .populate('videoId', 'title thumbnailUrl channelId')
            .populate('userId', 'name email')
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        watch_videos_model_1.VideoPurchase.countDocuments(query),
        watch_videos_model_1.VideoPurchase.aggregate([
            { $match: Object.assign(Object.assign({}, query), { paymentStatus: 'completed' }) },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Video purchases retrieved successfully',
        data: purchases,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            totalRevenue: ((_a = revenueData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0
        }
    });
}));
/**
 * Get vendor registrations and payments
 */
const getVendorRegistrations = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = req.user;
    if (!user || user.role !== 'admin') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.FORBIDDEN,
            success: false,
            message: 'Admin access required',
            data: null,
        });
    }
    const { page = 1, limit = 20, status, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (status)
        query.status = status;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate)
            query.createdAt.$gte = new Date(startDate);
        if (endDate)
            query.createdAt.$lte = new Date(endDate);
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (Number(page) - 1) * Number(limit);
    const [applications, total] = yield Promise.all([
        vendor_model_1.VendorApplication.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        vendor_model_1.VendorApplication.countDocuments(query)
    ]);
    // Get payment stats
    const paymentStats = yield vendor_model_1.VendorApplication.aggregate([
        { $match: { 'paymentInfo.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$paymentInfo.amount' }, count: { $sum: 1 } } }
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Vendor registrations retrieved successfully',
        data: applications,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            totalPayments: ((_a = paymentStats[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
            paidCount: ((_b = paymentStats[0]) === null || _b === void 0 ? void 0 : _b.count) || 0
        }
    });
}));
exports.DashboardController = {
    getDashboardStats,
    getAllTransactions,
    getVideoPurchases,
    getVendorRegistrations,
};
