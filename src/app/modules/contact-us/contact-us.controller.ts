import { NextFunction, Request, Response } from "express";
import { appError } from "../../errors/appError";
import { ContactUs } from "./contact-us.model";
import { ContactUsValidation } from "./contact-us.validation";

export const getContactUs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  try {
    let contactUs = await ContactUs.findOne();
    
    if (!contactUs) {
      contactUs = await ContactUs.create({
        content: '<p>Contact Us content goes here.</p>'
      });
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "Contact Us retrieved successfully",
      data: contactUs,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const updateContactUs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body;
    
    const validatedData = ContactUsValidation.parse({ content });
    
    let contactUs = await ContactUs.findOne();
    
    if (!contactUs) {
      contactUs = new ContactUs(validatedData);
      await contactUs.save();
    } else {
      contactUs.content = content;
      await contactUs.save();
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "Contact Us updated successfully",
      data: contactUs,
    });
    return;
  } catch (error) {
    next(error);
  }
};
