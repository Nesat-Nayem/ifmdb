import { Request, Response, NextFunction } from 'express';
import { Advertise } from './advertise.model';
import { advertiseCreateValidation, advertiseUpdateValidation } from './advertise.validation';
import { appError } from '../../errors/appError';

export const createAdvertise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // require image uploaded via multer
    if (!req.file) {
      return next(new appError('Image is required', 400));
    }

    const image = req.file.path; // cloudinary middleware should set this
    const status = (req.body.status as 'active' | 'inactive') || 'active';

    const validated = advertiseCreateValidation.parse({ image, status });

    const ad = await Advertise.create(validated);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Advertisement created successfully',
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAdvertisements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ads = await Advertise.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json({
      success: true,
      statusCode: 200,
      message: 'Advertisements retrieved successfully',
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdvertiseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ad = await Advertise.findOne({ _id: req.params.id, isDeleted: false });
    if (!ad) return next(new appError('Advertisement not found', 404));

    res.json({
      success: true,
      statusCode: 200,
      message: 'Advertisement retrieved successfully',
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdvertiseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ad = await Advertise.findOne({ _id: req.params.id, isDeleted: false });
    if (!ad) return next(new appError('Advertisement not found', 404));

    const updateData: { image?: string; status?: 'active' | 'inactive' } = {};

    if (req.file) updateData.image = req.file.path;
    if (req.body.status) updateData.status = req.body.status as 'active' | 'inactive';

    if (Object.keys(updateData).length === 0) {
      return res.json({
        success: true,
        statusCode: 200,
        message: 'No changes to update',
        data: ad,
      });
    }

    const validated = advertiseUpdateValidation.parse(updateData);

    const updated = await Advertise.findByIdAndUpdate(req.params.id, validated, { new: true });

    res.json({
      success: true,
      statusCode: 200,
      message: 'Advertisement updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdvertiseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ad = await Advertise.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!ad) return next(new appError('Advertisement not found', 404));

    res.json({
      success: true,
      statusCode: 200,
      message: 'Advertisement deleted successfully',
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};
