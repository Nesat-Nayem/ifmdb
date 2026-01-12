import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Event from './events.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { userInterface } from '../../middlewares/userInterface';

// Create a new event
const createEvent = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const eventData = { ...req.body };
  
  // If user is a vendor, add vendorId to the event
  if (user && user.role === 'vendor') {
    eventData.vendorId = user._id;
  }
  
  const newEvent = await Event.create(eventData);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event created successfully',
    data: newEvent
  });
});

// Get all events with filtering, searching, and pagination
const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const {
    page = 1,
    limit = 10,
    search,
    eventType,
    category,
    categoryId,
    eventLanguage,
    city,
    status,
    startDate,
    endDate,
    minPrice,
    maxPrice,
    sortBy = 'startDate',
    sortOrder = 'asc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter query
  const filter: any = { isActive: true };

  // Visibility schedule filter - only for non-admin/vendor panel requests
  const isAdminOrVendor = user && (user.role === 'admin' || user.role === 'vendor');
  if (!isAdminOrVendor) {
    const now = new Date();
    filter.$or = [
      { isScheduled: { $ne: true } },
      {
        isScheduled: true,
        $and: [
          { $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }] },
          { $or: [{ visibleUntil: null }, { visibleUntil: { $gt: now } }] }
        ]
      }
    ];
  }

  // Only filter by vendor when explicitly requested (e.g., from admin panel)
  // Frontend should show all events to everyone including vendors
  const { vendorOnly } = req.query;
  if (vendorOnly === 'true' && user && user.role === 'vendor') {
    filter.vendorId = user._id;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search as string, 'i')] } }
    ];
  }

  if (eventType) filter.eventType = eventType;
  if (category) filter.category = category;
  if (categoryId) filter.categoryId = categoryId;
  if (eventLanguage) filter.eventLanguage = { $regex: eventLanguage, $options: 'i' };
  if (city) filter['location.city'] = { $regex: city, $options: 'i' };
  if (status) filter.status = status;

  // Date range filter
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate as string);
    if (endDate) filter.startDate.$lte = new Date(endDate as string);
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.ticketPrice = {};
    if (minPrice) filter.ticketPrice.$gte = parseFloat(minPrice as string);
    if (maxPrice) filter.ticketPrice.$lte = parseFloat(maxPrice as string);
  }

  // Sort options
  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const events = await Event.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Event.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Events retrieved successfully',
    data: events,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get single event by ID
const getEventById = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { id } = req.params;
  
  const event = await Event.findById(id);
  
  if (!event || !event.isActive) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event not found',
      data: null
    });
  }

  // Check visibility schedule for public access
  const isAdminOrVendor = user && (user.role === 'admin' || user.role === 'vendor');
  if (!isAdminOrVendor && event.isScheduled) {
    const now = new Date();
    if (event.visibleFrom && now < event.visibleFrom) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        success: false,
        message: `This event will be visible from ${event.visibleFrom.toLocaleString()}`,
        data: { visibleFrom: event.visibleFrom }
      });
    }
    if (event.visibleUntil && now > event.visibleUntil) {
      return sendResponse(res, {
        statusCode: httpStatus.GONE,
        success: false,
        message: 'This event is no longer available',
        data: { expiredAt: event.visibleUntil }
      });
    }
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event retrieved successfully',
    data: event
  });
});

// Update event
const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const updatedEvent = await Event.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!updatedEvent) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event updated successfully',
    data: updatedEvent
  });
});

// Delete event (soft delete)
const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const deletedEvent = await Event.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  
  if (!deletedEvent) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event deleted successfully',
    data: deletedEvent
  });
});

// Get events by type
const getEventsByType = catchAsync(async (req: Request, res: Response) => {
  const { type } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const now = new Date();
  const visibilityFilter = {
    $or: [
      { isScheduled: { $ne: true } },
      {
        isScheduled: true,
        $and: [
          { $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }] },
          { $or: [{ visibleUntil: null }, { visibleUntil: { $gt: now } }] }
        ]
      }
    ]
  };

  const filter = { 
    eventType: type, 
    isActive: true,
    status: { $in: ['upcoming', 'ongoing'] },
    ...visibilityFilter
  };

  const events = await Event.find(filter)
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Event.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${type} events retrieved successfully`,
    data: events,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get upcoming events
const getUpcomingEvents = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const now = new Date();
  const visibilityFilter = {
    $or: [
      { isScheduled: { $ne: true } },
      {
        isScheduled: true,
        $and: [
          { $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }] },
          { $or: [{ visibleUntil: null }, { visibleUntil: { $gt: now } }] }
        ]
      }
    ]
  };

  const filter = {
    startDate: { $gte: now },
    status: 'upcoming',
    isActive: true,
    ...visibilityFilter
  };

  const events = await Event.find(filter)
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Event.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Upcoming events retrieved successfully',
    data: events,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get events by location/city
const getEventsByLocation = catchAsync(async (req: Request, res: Response) => {
  const { city } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const now = new Date();
  const visibilityFilter = {
    $or: [
      { isScheduled: { $ne: true } },
      {
        isScheduled: true,
        $and: [
          { $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }] },
          { $or: [{ visibleUntil: null }, { visibleUntil: { $gt: now } }] }
        ]
      }
    ]
  };

  const filter = {
    'location.city': { $regex: city, $options: 'i' },
    isActive: true,
    status: { $in: ['upcoming', 'ongoing'] },
    ...visibilityFilter
  };

  const events = await Event.find(filter)
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Event.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Events in ${city} retrieved successfully`,
    data: events,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get best events this week (sorted by ticket sales)
const getBestEventsThisWeek = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const visibilityFilter = {
    $or: [
      { isScheduled: { $ne: true } },
      {
        isScheduled: true,
        $and: [
          { $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }] },
          { $or: [{ visibleUntil: null }, { visibleUntil: { $gt: now } }] }
        ]
      }
    ]
  };

  const filter = {
    isActive: true,
    status: { $in: ['upcoming', 'ongoing'] },
    startDate: { $gte: new Date(), $lte: endOfWeek },
    ...visibilityFilter
  };

  const events = await Event.find(filter)
    .sort({ totalTicketsSold: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('categoryId', 'name image')
    .lean();

  const total = await Event.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Best events this week retrieved successfully',
    data: events,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get events by category ID
const getEventsByCategory = catchAsync(async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const now = new Date();
  const visibilityFilter = {
    $or: [
      { isScheduled: { $ne: true } },
      {
        isScheduled: true,
        $and: [
          { $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }] },
          { $or: [{ visibleUntil: null }, { visibleUntil: { $gt: now } }] }
        ]
      }
    ]
  };

  const filter = {
    categoryId,
    isActive: true,
    status: { $in: ['upcoming', 'ongoing'] },
    ...visibilityFilter
  };

  const events = await Event.find(filter)
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limitNum)
    .populate('categoryId', 'name image')
    .lean();

  const total = await Event.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Events by category retrieved successfully',
    data: events,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get events by language
const getEventsByLanguage = catchAsync(async (req: Request, res: Response) => {
  const { eventLanguage } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const now = new Date();
  const visibilityFilter = {
    $or: [
      { isScheduled: { $ne: true } },
      {
        isScheduled: true,
        $and: [
          { $or: [{ visibleFrom: null }, { visibleFrom: { $lte: now } }] },
          { $or: [{ visibleUntil: null }, { visibleUntil: { $gt: now } }] }
        ]
      }
    ]
  };

  const filter = {
    eventLanguage: { $regex: eventLanguage, $options: 'i' },
    isActive: true,
    status: { $in: ['upcoming', 'ongoing'] },
    ...visibilityFilter
  };

  const events = await Event.find(filter)
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limitNum)
    .populate('categoryId', 'name image')
    .lean();

  const total = await Event.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Events in ${eventLanguage} retrieved successfully`,
    data: events,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

export const EventController = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByType,
  getUpcomingEvents,
  getEventsByLocation,
  getBestEventsThisWeek,
  getEventsByCategory,
  getEventsByLanguage
};
