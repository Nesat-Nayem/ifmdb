import { Request, Response } from 'express';
import httpStatus from 'http-status';
import EventParticipationType from './event-participation-type.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const createParticipationType = catchAsync(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  const exists = await EventParticipationType.findOne({ name: name?.trim() });
  if (exists) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Participation type with this name already exists',
      data: null,
    });
  }

  const created = await EventParticipationType.create({ name: name?.trim(), description });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Participation type created successfully',
    data: created,
  });
});

const getAllParticipationTypes = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const filter: any = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const [types, total] = await Promise.all([
    EventParticipationType.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean(),
    EventParticipationType.countDocuments(filter),
  ]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Participation types retrieved successfully',
    data: types,
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

const getActiveParticipationTypes = catchAsync(async (req: Request, res: Response) => {
  const types = await EventParticipationType.find({ isActive: true }).sort({ name: 1 }).lean();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active participation types retrieved successfully',
    data: types,
  });
});

const getParticipationTypeById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const type = await EventParticipationType.findById(id);
  if (!type) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Participation type not found',
      data: null,
    });
  }
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Participation type retrieved', data: type });
});

const updateParticipationType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  if (name) {
    const exists = await EventParticipationType.findOne({ name: name.trim(), _id: { $ne: id } });
    if (exists) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Participation type with this name already exists',
        data: null,
      });
    }
  }

  const payload: any = {};
  if (name !== undefined) payload.name = name.trim();
  if (description !== undefined) payload.description = description;
  if (isActive !== undefined) payload.isActive = isActive;

  const updated = await EventParticipationType.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!updated) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Participation type not found',
      data: null,
    });
  }
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Participation type updated successfully', data: updated });
});

const deleteParticipationType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await EventParticipationType.findByIdAndDelete(id);
  if (!deleted) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Participation type not found',
      data: null,
    });
  }
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Participation type deleted successfully', data: deleted });
});

export const EventParticipationTypeController = {
  createParticipationType,
  getAllParticipationTypes,
  getActiveParticipationTypes,
  getParticipationTypeById,
  updateParticipationType,
  deleteParticipationType,
};
