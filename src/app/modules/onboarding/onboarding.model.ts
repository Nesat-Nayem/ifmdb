import mongoose, { Schema } from 'mongoose';
import { IOnboarding } from './onboarding.interface';

const OnboardingSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaTags: {
      type: [String],
      default: [],
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
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

export const Onboarding = mongoose.model<IOnboarding>('Onboarding', OnboardingSchema);
