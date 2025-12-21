import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { SectionDivider, SectionTitle } from './section-settings.model';

// ==================== SECTION DIVIDER CONTROLLERS ====================

// Get all section dividers
const getAllSectionDividers = catchAsync(async (req: Request, res: Response) => {
  const { isActive } = req.query;
  
  const query: any = {};
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const dividers = await SectionDivider.find(query).sort({ order: 1 });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section dividers retrieved successfully',
    data: dividers
  });
});

// Get section divider by key
const getSectionDividerByKey = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  
  const divider = await SectionDivider.findOne({ sectionKey: key });
  
  if (!divider) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Section divider not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section divider retrieved successfully',
    data: divider
  });
});

// Create section divider
const createSectionDivider = catchAsync(async (req: Request, res: Response) => {
  const dividerData = req.body;

  const existing = await SectionDivider.findOne({ sectionKey: dividerData.sectionKey });
  if (existing) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Section divider with this key already exists',
      data: null
    });
  }

  const divider = await SectionDivider.create(dividerData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Section divider created successfully',
    data: divider
  });
});

// Update section divider
const updateSectionDivider = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  const updateData = req.body;

  const divider = await SectionDivider.findOneAndUpdate(
    { sectionKey: key },
    updateData,
    { new: true, runValidators: true }
  );

  if (!divider) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Section divider not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section divider updated successfully',
    data: divider
  });
});

// Delete section divider
const deleteSectionDivider = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;

  const divider = await SectionDivider.findOneAndDelete({ sectionKey: key });

  if (!divider) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Section divider not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section divider deleted successfully',
    data: null
  });
});

// Bulk update section dividers order
const updateDividersOrder = catchAsync(async (req: Request, res: Response) => {
  const { orders } = req.body; // [{ sectionKey: string, order: number }]

  if (!Array.isArray(orders)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Orders must be an array',
      data: null
    });
  }

  const bulkOps = orders.map((item: { sectionKey: string; order: number }) => ({
    updateOne: {
      filter: { sectionKey: item.sectionKey },
      update: { $set: { order: item.order } }
    }
  }));

  await SectionDivider.bulkWrite(bulkOps);

  const dividers = await SectionDivider.find().sort({ order: 1 });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section dividers order updated successfully',
    data: dividers
  });
});

// ==================== SECTION TITLE CONTROLLERS ====================

// Get all section titles
const getAllSectionTitles = catchAsync(async (req: Request, res: Response) => {
  const { isActive, parentDivider } = req.query;
  
  const query: any = {};
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  if (parentDivider) {
    query.parentDivider = parentDivider;
  }

  const titles = await SectionTitle.find(query).sort({ parentDivider: 1, order: 1 });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section titles retrieved successfully',
    data: titles
  });
});

// Get section title by key
const getSectionTitleByKey = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  
  const title = await SectionTitle.findOne({ sectionKey: key });
  
  if (!title) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Section title not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section title retrieved successfully',
    data: title
  });
});

// Create section title
const createSectionTitle = catchAsync(async (req: Request, res: Response) => {
  const titleData = req.body;

  const existing = await SectionTitle.findOne({ sectionKey: titleData.sectionKey });
  if (existing) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Section title with this key already exists',
      data: null
    });
  }

  const title = await SectionTitle.create(titleData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Section title created successfully',
    data: title
  });
});

// Update section title
const updateSectionTitle = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  const updateData = req.body;

  const title = await SectionTitle.findOneAndUpdate(
    { sectionKey: key },
    updateData,
    { new: true, runValidators: true }
  );

  if (!title) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Section title not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section title updated successfully',
    data: title
  });
});

// Delete section title
const deleteSectionTitle = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;

  const title = await SectionTitle.findOneAndDelete({ sectionKey: key });

  if (!title) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Section title not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section title deleted successfully',
    data: null
  });
});

// Bulk update section titles order
const updateTitlesOrder = catchAsync(async (req: Request, res: Response) => {
  const { orders } = req.body; // [{ sectionKey: string, order: number }]

  if (!Array.isArray(orders)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Orders must be an array',
      data: null
    });
  }

  const bulkOps = orders.map((item: { sectionKey: string; order: number }) => ({
    updateOne: {
      filter: { sectionKey: item.sectionKey },
      update: { $set: { order: item.order } }
    }
  }));

  await SectionTitle.bulkWrite(bulkOps);

  const titles = await SectionTitle.find().sort({ parentDivider: 1, order: 1 });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section titles order updated successfully',
    data: titles
  });
});

// ==================== PUBLIC API ====================

// Get all section settings (for frontend)
const getAllSectionSettings = catchAsync(async (req: Request, res: Response) => {
  const [dividers, titles] = await Promise.all([
    SectionDivider.find({ isActive: true }).sort({ order: 1 }),
    SectionTitle.find({ isActive: true }).sort({ parentDivider: 1, order: 1 })
  ]);

  // Group titles by parent divider
  const groupedData = dividers.map(divider => ({
    divider,
    sections: titles.filter(title => title.parentDivider === divider.sectionKey)
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Section settings retrieved successfully',
    data: {
      dividers,
      titles,
      grouped: groupedData
    }
  });
});

// Seed default section settings
const seedDefaultSettings = catchAsync(async (req: Request, res: Response) => {
  // Default Section Dividers
  const defaultDividers = [
    {
      sectionKey: 'trade_movies',
      title: '🎬 Trade Movies',
      subtitle: 'Discover film rights and investment opportunities',
      icon: '🎬',
      order: 1,
      isActive: true
    },
    {
      sectionKey: 'live_events',
      title: '🎭 Live Events & Experiences',
      subtitle: 'Book your next unforgettable experience',
      icon: '🎭',
      order: 2,
      isActive: true
    },
    {
      sectionKey: 'watch_movie',
      title: '🎥 Watch Movie',
      subtitle: 'Stream the latest movies and series',
      icon: '🎥',
      order: 3,
      isActive: true
    }
  ];

  // Default Section Titles
  const defaultTitles = [
    // Trade Movies sections
    { sectionKey: 'hot_rights_available', parentDivider: 'trade_movies', title: '🔥 Hot Rights Available', icon: '🔥', viewMoreLink: '/film-mart?section=hot_rights_available', order: 1 },
    { sectionKey: 'profitable_picks', parentDivider: 'trade_movies', title: '💰 Profitable Picks', icon: '💰', viewMoreLink: '/film-mart?section=profitable_picks', order: 2 },
    { sectionKey: 'international_deals', parentDivider: 'trade_movies', title: '🌍 International Deals', icon: '🌍', viewMoreLink: '/film-mart?section=international_deals', order: 3 },
    { sectionKey: 'indie_gems', parentDivider: 'trade_movies', title: '💎 Indie Gems', icon: '💎', viewMoreLink: '/film-mart?section=indie_gems', order: 4 },
    
    // Live Events sections
    { sectionKey: 'trending_events', parentDivider: 'live_events', title: '🔥 Trending Events', icon: '🔥', viewMoreLink: '/events?section=trending_events', order: 1 },
    { sectionKey: 'celebrity_events', parentDivider: 'live_events', title: '⭐ Celebrity Events', icon: '⭐', viewMoreLink: '/events?section=celebrity_events', order: 2 },
    { sectionKey: 'exclusive_invite_only', parentDivider: 'live_events', title: '🎟️ Exclusive / Invite Only', icon: '🎟️', viewMoreLink: '/events?section=exclusive_invite_only', order: 3 },
    { sectionKey: 'near_you', parentDivider: 'live_events', title: '📍 Near You', icon: '📍', viewMoreLink: '/events?section=near_you', order: 4 },
    
    // Watch Movie sections
    { sectionKey: 'trending_now', parentDivider: 'watch_movie', title: '🔥 Trending Now', icon: '🔥', viewMoreLink: '/watch-movies?section=trending_now', order: 1 },
    { sectionKey: 'most_popular', parentDivider: 'watch_movie', title: '🏆 Most Popular', icon: '🏆', viewMoreLink: '/watch-movies?section=most_popular', order: 2 },
    { sectionKey: 'exclusive_on_moviemart', parentDivider: 'watch_movie', title: '✨ Exclusive on Movie Mart', icon: '✨', viewMoreLink: '/watch-movies?section=exclusive_on_moviemart', order: 3 },
    { sectionKey: 'new_release', parentDivider: 'watch_movie', title: '🆕 New Release', icon: '🆕', viewMoreLink: '/watch-movies?section=new_release', order: 4 }
  ];

  // Insert dividers (upsert)
  for (const divider of defaultDividers) {
    await SectionDivider.findOneAndUpdate(
      { sectionKey: divider.sectionKey },
      divider,
      { upsert: true, new: true }
    );
  }

  // Insert titles (upsert)
  for (const title of defaultTitles) {
    await SectionTitle.findOneAndUpdate(
      { sectionKey: title.sectionKey },
      title,
      { upsert: true, new: true }
    );
  }

  const [dividers, titles] = await Promise.all([
    SectionDivider.find().sort({ order: 1 }),
    SectionTitle.find().sort({ parentDivider: 1, order: 1 })
  ]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Default section settings seeded successfully',
    data: { dividers, titles }
  });
});

export const SectionSettingsController = {
  // Dividers
  getAllSectionDividers,
  getSectionDividerByKey,
  createSectionDivider,
  updateSectionDivider,
  deleteSectionDivider,
  updateDividersOrder,
  
  // Titles
  getAllSectionTitles,
  getSectionTitleByKey,
  createSectionTitle,
  updateSectionTitle,
  deleteSectionTitle,
  updateTitlesOrder,
  
  // Public & Utility
  getAllSectionSettings,
  seedDefaultSettings
};
