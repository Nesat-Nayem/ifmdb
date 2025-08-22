import { NextFunction, Request, Response } from 'express';
import { Onboarding } from './onboarding.model';
import { onboardingCreateValidation, onboardingUpdateValidation } from './onboarding.validation';
import { appError } from '../../errors/appError';

export const createOnboarding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, subtitle, status, metaTitle, metaTags, metaDescription } = req.body as any;

    if (!req.file) {
      next(new appError('Onboarding image is required', 400));
      return;
    }

    const image = req.file.path;

    const parsedMetaTags = Array.isArray(metaTags)
      ? metaTags
      : typeof metaTags === 'string' && metaTags.trim().length
      ? metaTags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : undefined;

    const validated = onboardingCreateValidation.parse({
      title,
      subtitle,
      image,
      status,
      metaTitle,
      metaTags: parsedMetaTags,
      metaDescription,
    });

    const item = new Onboarding(validated);
    await item.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Onboarding created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOnboarding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as { status?: string };
    const filter: any = { isDeleted: false };
    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status;
    }
    const items = await Onboarding.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      statusCode: 200,
      message: items.length ? 'Onboarding list retrieved successfully' : 'No onboarding items found',
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const getOnboardingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await Onboarding.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      next(new appError('Onboarding item not found', 404));
      return;
    }
    res.json({
      success: true,
      statusCode: 200,
      message: 'Onboarding item retrieved successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOnboardingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await Onboarding.findOne({ _id: id, isDeleted: false });
    if (!existing) {
      next(new appError('Onboarding item not found', 404));
      return;
    }

    const { title, subtitle, status, metaTitle, metaTags, metaDescription } = req.body as any;
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (status !== undefined) updateData.status = status;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaTags !== undefined) {
      updateData.metaTags = Array.isArray(metaTags)
        ? metaTags
        : typeof metaTags === 'string' && metaTags.trim().length
        ? metaTags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];
    }

    if (req.file) {
      updateData.image = req.file.path;
    }

    const validated = onboardingUpdateValidation.parse(updateData);

    const updated = await Onboarding.findByIdAndUpdate(id, validated, { new: true });

    res.json({
      success: true,
      statusCode: 200,
      message: 'Onboarding item updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOnboardingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await Onboarding.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!updated) {
      next(new appError('Onboarding item not found', 404));
      return;
    }
    res.json({
      success: true,
      statusCode: 200,
      message: 'Onboarding item deleted successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
