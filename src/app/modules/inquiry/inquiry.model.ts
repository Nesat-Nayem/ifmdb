import mongoose, { Schema } from 'mongoose';
import { IInquiry } from './inquiry.interface';

const InquirySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
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

export const Inquiry = mongoose.model<IInquiry>('Inquiry', InquirySchema);
