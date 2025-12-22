import { NextFunction, Request, Response } from "express";
import { appError } from "../../errors/appError";
import { PartnerTerms } from "./partner-terms.model";
import { PartnerTermsValidation } from "./partner-terms.validation";

export const getPartnerTerms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  try {
    let partnerTerms = await PartnerTerms.findOne();
    
    if (!partnerTerms) {
      partnerTerms = await PartnerTerms.create({
        content: '<p>Partner Terms and Conditions content goes here.</p>'
      });
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "Partner Terms and Conditions retrieved successfully",
      data: partnerTerms,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const updatePartnerTerms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body;
    
    const validatedData = PartnerTermsValidation.parse({ content });
    
    let partnerTerms = await PartnerTerms.findOne();
    
    if (!partnerTerms) {
      partnerTerms = new PartnerTerms(validatedData);
      await partnerTerms.save();
    } else {
      partnerTerms.content = content;
      await partnerTerms.save();
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "Partner Terms and Conditions updated successfully",
      data: partnerTerms,
    });
    return;
  } catch (error) {
    next(error);
  }
};
