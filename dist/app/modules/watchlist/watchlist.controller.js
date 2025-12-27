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
exports.WatchlistController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const watchlist_model_1 = require("./watchlist.model");
const watch_videos_model_1 = require("../watch-videos/watch-videos.model");
const movies_model_1 = __importDefault(require("../movies/movies.model"));
const events_model_1 = __importDefault(require("../events/events.model"));
// Add item to watchlist
const addToWatchlist = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { itemType, itemId } = req.body;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Please login to add items to watchlist',
            data: null,
        });
    }
    // Check if item already exists in watchlist
    const existingItem = yield watchlist_model_1.Watchlist.findOne({
        userId: user._id,
        itemType,
        itemId
    });
    if (existingItem) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Item already in watchlist',
            data: null,
        });
    }
    // Verify item exists
    let itemExists = false;
    if (itemType === 'watch-video') {
        itemExists = !!(yield watch_videos_model_1.WatchVideo.findById(itemId));
    }
    else if (itemType === 'movie') {
        itemExists = !!(yield movies_model_1.default.findById(itemId));
    }
    else if (itemType === 'event') {
        itemExists = !!(yield events_model_1.default.findById(itemId));
    }
    if (!itemExists) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Item not found',
            data: null,
        });
    }
    const watchlistItem = yield watchlist_model_1.Watchlist.create({
        userId: user._id,
        itemType,
        itemId
    });
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Added to watchlist successfully',
        data: watchlistItem,
    });
}));
// Remove item from watchlist
const removeFromWatchlist = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { itemType, itemId } = req.body;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const result = yield watchlist_model_1.Watchlist.findOneAndDelete({
        userId: user._id,
        itemType,
        itemId
    });
    if (!result) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Item not found in watchlist',
            data: null,
        });
    }
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Removed from watchlist successfully',
        data: null,
    });
}));
// Check if item is in watchlist
const checkWatchlistStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { itemType, itemId } = req.params;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Watchlist status retrieved',
            data: { inWatchlist: false },
        });
    }
    const item = yield watchlist_model_1.Watchlist.findOne({
        userId: user._id,
        itemType,
        itemId
    });
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Watchlist status retrieved',
        data: { inWatchlist: !!item },
    });
}));
// Get user's watchlist
const getUserWatchlist = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { itemType, page = 1, limit = 20 } = req.query;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const query = { userId: user._id };
    if (itemType) {
        query.itemType = itemType;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = yield Promise.all([
        watchlist_model_1.Watchlist.find(query)
            .sort({ addedAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        watchlist_model_1.Watchlist.countDocuments(query)
    ]);
    // Populate items based on type
    const populatedItems = yield Promise.all(items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        let populatedItem = null;
        if (item.itemType === 'watch-video') {
            populatedItem = yield watch_videos_model_1.WatchVideo.findById(item.itemId)
                .select('title thumbnailUrl posterUrl duration videoType genres isFree channelId viewCount likeCount')
                .populate('channelId', 'name logoUrl isVerified');
        }
        else if (item.itemType === 'movie') {
            populatedItem = yield movies_model_1.default.findById(item.itemId)
                .select('title poster synopsis genre releaseDate rating');
        }
        else if (item.itemType === 'event') {
            populatedItem = yield events_model_1.default.findById(item.itemId)
                .select('title posterImage bannerImage shortDescription eventDate location category');
        }
        return {
            _id: item._id,
            itemType: item.itemType,
            addedAt: item.addedAt,
            item: populatedItem
        };
    })));
    // Filter out items where the referenced item no longer exists
    const validItems = populatedItems.filter(item => item.item !== null);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Watchlist retrieved successfully',
        data: validItems,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
}));
// Get watchlist counts by type
const getWatchlistCounts = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const [watchVideosCount, moviesCount, eventsCount] = yield Promise.all([
        watchlist_model_1.Watchlist.countDocuments({ userId: user._id, itemType: 'watch-video' }),
        watchlist_model_1.Watchlist.countDocuments({ userId: user._id, itemType: 'movie' }),
        watchlist_model_1.Watchlist.countDocuments({ userId: user._id, itemType: 'event' })
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Watchlist counts retrieved',
        data: {
            watchVideos: watchVideosCount,
            movies: moviesCount,
            events: eventsCount,
            total: watchVideosCount + moviesCount + eventsCount
        },
    });
}));
exports.WatchlistController = {
    addToWatchlist,
    removeFromWatchlist,
    checkWatchlistStatus,
    getUserWatchlist,
    getWatchlistCounts
};
