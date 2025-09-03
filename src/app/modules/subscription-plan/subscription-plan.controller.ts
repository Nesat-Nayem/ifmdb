import { Request, Response, NextFunction } from 'express';
import { SubscriptionPlan } from './subscription-plan.model';
import { subscriptionPlanCreateValidation, subscriptionPlanUpdateValidation } from './subscription-plan.validation';
import { appError } from '../../errors/appError';

export const createSubscriptionPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = subscriptionPlanCreateValidation.parse(req.body);
    const created = await SubscriptionPlan.create(payload);
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Subscription plan created successfully',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSubscriptionPlans = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await SubscriptionPlan.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, statusCode: 200, message: 'Subscription plans retrieved successfully', data });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionPlanById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await SubscriptionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return next(new appError('Subscription plan not found', 404));
    res.json({ success: true, statusCode: 200, message: 'Subscription plan retrieved successfully', data: plan });
  } catch (error) {
    next(error);
  }
};

export const updateSubscriptionPlanById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await SubscriptionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return next(new appError('Subscription plan not found', 404));

    const payload = subscriptionPlanUpdateValidation.parse(req.body);
    const updated = await SubscriptionPlan.findByIdAndUpdate(req.params.id, payload, { new: true });

    res.json({ success: true, statusCode: 200, message: 'Subscription plan updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscriptionPlanById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await SubscriptionPlan.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!plan) return next(new appError('Subscription plan not found', 404));

    res.json({ success: true, statusCode: 200, message: 'Subscription plan deleted successfully', data: plan });
  } catch (error) {
    next(error);
  }
};
