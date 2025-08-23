import { Request, Response, NextFunction } from 'express';
import { HelpCenter } from './help-center.model';
import { helpCenterValidation } from './help-center.validation';

export const getHelpCenter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let hc = await HelpCenter.findOne();
    if (!hc) {
      hc = await HelpCenter.create({ content: '<p>Help Center content goes here.</p>' });
    }
    res.json({
      success: true,
      statusCode: 200,
      message: 'Help Center retrieved successfully',
      data: hc,
    });
  } catch (error) {
    next(error);
  }
};

export const updateHelpCenter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    const validated = helpCenterValidation.parse({ content });

    let hc = await HelpCenter.findOne();
    if (!hc) {
      hc = await HelpCenter.create(validated);
    } else {
      hc.content = validated.content;
      await hc.save();
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Help Center updated successfully',
      data: hc,
    });
  } catch (error) {
    next(error);
  }
};
