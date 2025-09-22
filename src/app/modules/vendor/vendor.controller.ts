import { NextFunction, Response } from 'express';
import { VendorApplication } from './vendor.model';
import { vendorCreateValidation, vendorDecisionValidation } from './vendor.validation';
import { appError } from '../../errors/appError';
import { userInterface } from '../../middlewares/userInterface';

export const createVendorApplication = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { vendorName, businessType, gstNumber, panNumber, address, email, phone } = req.body;

    // Validate base fields
    const validated = vendorCreateValidation.parse({ vendorName, businessType, gstNumber, panNumber, address, email, phone });

    // Build file URLs if provided via multer upload.fields
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const aadharFrontUrl = files?.aadharFront?.[0]?.path || '';
    const aadharBackUrl = files?.aadharBack?.[0]?.path || '';
    const panImageUrl = files?.panImage?.[0]?.path || '';

    const doc = await VendorApplication.create({
      userId: req.user?._id,
      ...validated,
      aadharFrontUrl,
      aadharBackUrl,
      panImageUrl,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Vendor application submitted successfully',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const listVendorApplications = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { status, userId } = req.query as { status?: string; userId?: string };
    const filter: any = { isDeleted: false };
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const items = await VendorApplication.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      statusCode: 200,
      message: items.length ? 'Vendor applications retrieved successfully' : 'No vendor applications found',
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorApplicationById = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await VendorApplication.findOne({ _id: id, isDeleted: false });
    if (!item) return next(new appError('Vendor application not found', 404));

    // If non-admin, only allow owner to view
    if (req.user?.role !== 'admin' && String(item.userId) !== String(req.user?._id)) {
      return next(new appError('You do not have permission to view this application', 403));
    }

    res.json({ success: true, statusCode: 200, message: 'Vendor application retrieved successfully', data: item });
  } catch (error) {
    next(error);
  }
};

export const decideVendorApplication = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { decision, rejectionReason } = vendorDecisionValidation.parse(req.body);

    const item = await VendorApplication.findOne({ _id: id, isDeleted: false });
    if (!item) return next(new appError('Vendor application not found', 404));
    if (item.status !== 'pending') return next(new appError('Application already processed', 400));

    if (decision === 'approve') {
      item.status = 'approved';
      item.approvedAt = new Date();
      item.approvedBy = req.user?._id;
    } else {
      item.status = 'rejected';
      item.rejectionReason = rejectionReason || 'Not specified';
    }

    await item.save();

    res.json({ success: true, statusCode: 200, message: `Application ${item.status}`, data: item });
  } catch (error) {
    next(error);
  }
};
