import mongoose, { Schema } from 'mongoose';
import { IVendorApplication } from './vendor.interface';

const VendorApplicationSchema = new Schema<IVendorApplication>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vendorName: { type: String, required: true },
  businessType: { type: String, required: true },
  gstNumber: { type: String, default: '' },
  panNumber: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  aadharFrontUrl: { type: String, default: '' },
  aadharBackUrl: { type: String, default: '' },
  panImageUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejectionReason: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false, index: true },
  approvedAt: { type: Date },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

VendorApplicationSchema.index({ userId: 1, status: 1 });

export const VendorApplication = mongoose.model<IVendorApplication>('VendorApplication', VendorApplicationSchema);
