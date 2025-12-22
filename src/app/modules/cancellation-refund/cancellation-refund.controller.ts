import { NextFunction, Request, Response } from "express";
import { appError } from "../../errors/appError";
import { CancellationRefund } from "./cancellation-refund.model";
import { CancellationRefundValidation } from "./cancellation-refund.validation";

export const getCancellationRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  try {
    let cancellationRefund = await CancellationRefund.findOne();
    
    if (!cancellationRefund) {
      cancellationRefund = await CancellationRefund.create({
        content: '<p>Cancellation & Refund Policy content goes here.</p>'
      });
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "Cancellation & Refund Policy retrieved successfully",
      data: cancellationRefund,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const updateCancellationRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body;
    
    const validatedData = CancellationRefundValidation.parse({ content });
    
    let cancellationRefund = await CancellationRefund.findOne();
    
    if (!cancellationRefund) {
      cancellationRefund = new CancellationRefund(validatedData);
      await cancellationRefund.save();
    } else {
      cancellationRefund.content = content;
      await cancellationRefund.save();
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "Cancellation & Refund Policy updated successfully",
      data: cancellationRefund,
    });
    return;
  } catch (error) {
    next(error);
  }
};
