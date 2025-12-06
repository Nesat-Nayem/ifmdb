import { Request, Response, NextFunction } from 'express';
import { GeneralSettings } from './general-settings.model';
import { generalSettingsValidation } from './general-settings.validation';

// Interface for multer files
interface MulterFiles {
  logo?: Express.Multer.File[];
  favicon?: Express.Multer.File[];
}

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

    // Handle uploaded files (logo and favicon)
    const files = req.files as MulterFiles;
    
    // If logo was uploaded, get the Cloudinary URL
    if (files?.logo && files.logo[0]) {
      (validated as any).logo = (files.logo[0] as any).path;
    }
    
    // If favicon was uploaded, get the Cloudinary URL
    if (files?.favicon && files.favicon[0]) {
      (validated as any).favicon = (files.favicon[0] as any).path;
    }

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
