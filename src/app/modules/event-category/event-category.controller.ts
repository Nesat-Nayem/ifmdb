import { Request, Response } from 'express';
import httpStatus from 'http-status';
import EventCategory from './event-category.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

// Create a new event category
const createEventCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryData = req.body;
  
  // Handle image from multer/cloudinary
  if (req.file) {
    categoryData.image = (req.file as any).path || req.file.filename;
  }
  
  const newCategory = await EventCategory.create(categoryData);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event category created successfully',
    data: newCategory
  });
});

// Get all event categories with filtering
const getAllEventCategories = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 50,
    search,
    isMusicShow,
    isComedyShow,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter query
  const filter: any = {};

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  if (isMusicShow !== undefined) {
    filter.isMusicShow = isMusicShow === 'true';
  }

  if (isComedyShow !== undefined) {
    filter.isComedyShow = isComedyShow === 'true';
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  // Sort options
  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const categories = await EventCategory.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await EventCategory.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event categories retrieved successfully',
    data: categories,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get music show categories
const getMusicShowCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await EventCategory.find({ 
    isMusicShow: true, 
    isActive: true 
  }).lean();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Music show categories retrieved successfully',
    data: categories
  });
});

// Get comedy show categories
const getComedyShowCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await EventCategory.find({ 
    isComedyShow: true, 
    isActive: true 
  }).lean();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comedy show categories retrieved successfully',
    data: categories
  });
});

// Get single event category by ID
const getEventCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const category = await EventCategory.findById(id);
  
  if (!category) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event category not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event category retrieved successfully',
    data: category
  });
});

// Update event category
const updateEventCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Handle image from multer/cloudinary
  if (req.file) {
    updateData.image = (req.file as any).path || req.file.filename;
  }
  
  const updatedCategory = await EventCategory.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!updatedCategory) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event category not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event category updated successfully',
    data: updatedCategory
  });
});

// Delete event category (soft delete)
const deleteEventCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const deletedCategory = await EventCategory.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  
  if (!deletedCategory) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event category not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event category deleted successfully',
    data: deletedCategory
  });
});

// Hard delete event category
const hardDeleteEventCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const deletedCategory = await EventCategory.findByIdAndDelete(id);
  
  if (!deletedCategory) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event category not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event category permanently deleted',
    data: deletedCategory
  });
});

export const EventCategoryController = {
  createEventCategory,
  getAllEventCategories,
  getMusicShowCategories,
  getComedyShowCategories,
  getEventCategoryById,
  updateEventCategory,
  deleteEventCategory,
  hardDeleteEventCategory
};
