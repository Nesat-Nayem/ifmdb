import { Request, Response } from 'express';
import httpStatus from 'http-status';
import EventType from './event-type.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const createEventType = catchAsync(async (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title || !String(title).trim()) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Title is required',
      data: null,
    });
  }

  const exists = await EventType.findOne({ title: String(title).trim() });
  if (exists) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Event type with this title already exists',
      data: null,
    });
  }

  const created = await EventType.create({ title: String(title).trim() });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event type created successfully',
    data: created,
  });
});

const getAllEventTypes = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const filter: any = {};
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const [types, total] = await Promise.all([
    EventType.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean(),
    EventType.countDocuments(filter),
  ]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event types retrieved successfully',
    data: types,
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

const getActiveEventTypes = catchAsync(async (_req: Request, res: Response) => {
  const types = await EventType.find({ isActive: true }).sort({ title: 1 }).lean();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active event types retrieved successfully',
    data: types,
  });
});

const getEventTypeById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const type = await EventType.findById(id);
  if (!type) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event type not found',
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event type retrieved',
    data: type,
  });
});

const updateEventType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, isActive } = req.body;

  if (title !== undefined) {
    const trimmed = String(title).trim();
    if (!trimmed) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Title cannot be empty',
        data: null,
      });
    }
    const exists = await EventType.findOne({ title: trimmed, _id: { $ne: id } });
    if (exists) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Event type with this title already exists',
        data: null,
      });
    }
  }

  const payload: any = {};
  if (title !== undefined) payload.title = String(title).trim();
  if (isActive !== undefined) payload.isActive = isActive;

  const updated = await EventType.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!updated) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event type not found',
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event type updated successfully',
    data: updated,
  });
});

const deleteEventType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await EventType.findByIdAndDelete(id);
  if (!deleted) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event type not found',
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event type deleted successfully',
    data: deleted,
  });
});

export const EventTypeController = {
  createEventType,
  getAllEventTypes,
  getActiveEventTypes,
  getEventTypeById,
  updateEventType,
  deleteEventType,
};
