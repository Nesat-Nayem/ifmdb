import { Request, Response, NextFunction } from 'express';
import { GeneralSettings } from './general-settings.model';
import { generalSettingsValidation } from './general-settings.validation';

export const getGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await GeneralSettings.findOne();
    if (!settings) {
      settings = await GeneralSettings.create({});
    }
    res.json({
      success: true,
      statusCode: 200,
      message: 'General settings retrieved successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = generalSettingsValidation.parse(req.body || {});

    let settings = await GeneralSettings.findOne();
    if (!settings) {
      settings = await GeneralSettings.create(validated);
    } else {
      Object.assign(settings, validated);
      await settings.save();
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'General settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
