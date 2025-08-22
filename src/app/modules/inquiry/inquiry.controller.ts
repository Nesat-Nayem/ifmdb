import { NextFunction, Request, Response } from 'express';
import { Inquiry } from './inquiry.model';
import { inquiryCreateValidation, inquiryUpdateValidation } from './inquiry.validation';
import { appError } from '../../errors/appError';

export const createInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, purpose, message } = req.body;

    const validated = inquiryCreateValidation.parse({ name, email, phone, purpose, message });

    const item = new Inquiry(validated);
    await item.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Inquiry submitted successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllInquiries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { purpose } = req.query as { purpose?: string };
    const filter: any = { isDeleted: false };
    if (purpose) filter.purpose = purpose;

    const items = await Inquiry.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      statusCode: 200,
      message: items.length ? 'Inquiries retrieved successfully' : 'No inquiries found',
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const getInquiryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await Inquiry.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) return next(new appError('Inquiry not found', 404));

    res.json({
      success: true,
      statusCode: 200,
      message: 'Inquiry retrieved successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInquiryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await Inquiry.findOne({ _id: id, isDeleted: false });
    if (!existing) return next(new appError('Inquiry not found', 404));

    const { name, email, phone, purpose, message } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (message !== undefined) updateData.message = message;

    const validated = inquiryUpdateValidation.parse(updateData);

    const updated = await Inquiry.findByIdAndUpdate(id, validated, { new: true });

    res.json({
      success: true,
      statusCode: 200,
      message: 'Inquiry updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInquiryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await Inquiry.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!updated) return next(new appError('Inquiry not found', 404));

    res.json({
      success: true,
      statusCode: 200,
      message: 'Inquiry deleted successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
