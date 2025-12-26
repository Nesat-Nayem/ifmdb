import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { userInterface } from '../../middlewares/userInterface';
import { Watchlist } from './watchlist.model';
import { WatchVideo } from '../watch-videos/watch-videos.model';
import Movie from '../movies/movies.model';
import Event from '../events/events.model';

// Add item to watchlist
const addToWatchlist = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { itemType, itemId } = req.body;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Please login to add items to watchlist',
      data: null,
    });
  }

  // Check if item already exists in watchlist
  const existingItem = await Watchlist.findOne({
    userId: user._id,
    itemType,
    itemId
  });

  if (existingItem) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Item already in watchlist',
      data: null,
    });
  }

  // Verify item exists
  let itemExists = false;
  if (itemType === 'watch-video') {
    itemExists = !!(await WatchVideo.findById(itemId));
  } else if (itemType === 'movie') {
    itemExists = !!(await Movie.findById(itemId));
  } else if (itemType === 'event') {
    itemExists = !!(await Event.findById(itemId));
  }

  if (!itemExists) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Item not found',
      data: null,
    });
  }

  const watchlistItem = await Watchlist.create({
    userId: user._id,
    itemType,
    itemId
  });

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Added to watchlist successfully',
    data: watchlistItem,
  });
});

// Remove item from watchlist
const removeFromWatchlist = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { itemType, itemId } = req.body;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const result = await Watchlist.findOneAndDelete({
    userId: user._id,
    itemType,
    itemId
  });

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Item not found in watchlist',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Removed from watchlist successfully',
    data: null,
  });
});

// Check if item is in watchlist
const checkWatchlistStatus = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { itemType, itemId } = req.params;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Watchlist status retrieved',
      data: { inWatchlist: false },
    });
  }

  const item = await Watchlist.findOne({
    userId: user._id,
    itemType,
    itemId
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Watchlist status retrieved',
    data: { inWatchlist: !!item },
  });
});

// Get user's watchlist
const getUserWatchlist = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { itemType, page = 1, limit = 20 } = req.query;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const query: any = { userId: user._id };
  if (itemType) {
    query.itemType = itemType;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Watchlist.find(query)
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Watchlist.countDocuments(query)
  ]);

  // Populate items based on type
  const populatedItems = await Promise.all(
    items.map(async (item) => {
      let populatedItem = null;
      
      if (item.itemType === 'watch-video') {
        populatedItem = await WatchVideo.findById(item.itemId)
          .select('title thumbnailUrl posterUrl duration videoType genres isFree channelId viewCount likeCount')
          .populate('channelId', 'name logoUrl isVerified');
      } else if (item.itemType === 'movie') {
        populatedItem = await Movie.findById(item.itemId)
          .select('title poster synopsis genre releaseDate rating');
      } else if (item.itemType === 'event') {
        populatedItem = await Event.findById(item.itemId)
          .select('title posterImage bannerImage shortDescription eventDate location category');
      }

      return {
        _id: item._id,
        itemType: item.itemType,
        addedAt: item.addedAt,
        item: populatedItem
      };
    })
  );

  // Filter out items where the referenced item no longer exists
  const validItems = populatedItems.filter(item => item.item !== null);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

// Get watchlist counts by type
const getWatchlistCounts = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const [watchVideosCount, moviesCount, eventsCount] = await Promise.all([
    Watchlist.countDocuments({ userId: user._id, itemType: 'watch-video' }),
    Watchlist.countDocuments({ userId: user._id, itemType: 'movie' }),
    Watchlist.countDocuments({ userId: user._id, itemType: 'event' })
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Watchlist counts retrieved',
    data: {
      watchVideos: watchVideosCount,
      movies: moviesCount,
      events: eventsCount,
      total: watchVideosCount + moviesCount + eventsCount
    },
  });
});

export const WatchlistController = {
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlistStatus,
  getUserWatchlist,
  getWatchlistCounts
};
