import mongoose, { Schema } from 'mongoose';
import { ISubscriptionPlan } from './subscription-plan.interface';

const SubscriptionPlanSchema: Schema = new Schema(
  {
    planName: { type: String, required: true, trim: true },
    planCost: { type: Number, required: true, min: 0 },
    planInclude: { type: [String], required: true, default: [] },
    metaTitle: { type: String, trim: true },
    metaTag: { type: [String], default: [] },
    metaDescription: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        if (ret.createdAt) ret.createdAt = new Date(ret.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      },
    },
  }
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
