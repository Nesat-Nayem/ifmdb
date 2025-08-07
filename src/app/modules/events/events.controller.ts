import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Event from './events.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

// Create a new event
const createEvent = catchAsync(async (req: Request, res: Response) => {
  const eventData = req.body;
  
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
  const {
    page = 1,
    limit = 10,
    search,
    eventType,
    category,
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

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search as string, 'i')] } }
    ];
  }

  if (eventType) filter.eventType = eventType;
  if (category) filter.category = category;
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
  const { id } = req.params;
  
  const event = await Event.findById(id);
  
  if (!event) {
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

  const events = await Event.find({ 
    eventType: type, 
    isActive: true,
    status: { $in: ['upcoming', 'ongoing'] }
  })
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Event.countDocuments({ 
    eventType: type, 
    isActive: true,
    status: { $in: ['upcoming', 'ongoing'] }
  });

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

  const currentDate = new Date();

  const events = await Event.find({
    startDate: { $gte: currentDate },
    status: 'upcoming',
    isActive: true
  })
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Event.countDocuments({
    startDate: { $gte: currentDate },
    status: 'upcoming',
    isActive: true
  });

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

  const events = await Event.find({
    'location.city': { $regex: city, $options: 'i' },
    isActive: true,
    status: { $in: ['upcoming', 'ongoing'] }
  })
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Event.countDocuments({
    'location.city': { $regex: city, $options: 'i' },
    isActive: true,
    status: { $in: ['upcoming', 'ongoing'] }
  });

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

export const EventController = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByType,
  getUpcomingEvents,
  getEventsByLocation
};
