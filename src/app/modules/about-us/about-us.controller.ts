import { NextFunction, Request, Response } from "express";
import { appError } from "../../errors/appError";
import { AboutUs } from "./about-us.model";
import { AboutUsValidation } from "./about-us.validation";

export const getAboutUs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  try {
    let aboutUs = await AboutUs.findOne();
    
    if (!aboutUs) {
      aboutUs = await AboutUs.create({
        content: '<p>About Us content goes here.</p>'
      });
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "About Us retrieved successfully",
      data: aboutUs,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const updateAboutUs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body;
    
    const validatedData = AboutUsValidation.parse({ content });
    
    let aboutUs = await AboutUs.findOne();
    
    if (!aboutUs) {
      aboutUs = new AboutUs(validatedData);
      await aboutUs.save();
    } else {
      aboutUs.content = content;
      await aboutUs.save();
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "About Us updated successfully",
      data: aboutUs,
    });
    return;
  } catch (error) {
    next(error);
  }
};
