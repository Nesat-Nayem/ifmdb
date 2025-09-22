import { Document, Types } from 'mongoose';

export interface IVendorApplication extends Document {
  userId: Types.ObjectId;
  vendorName: string;
  businessType: string;
  gstNumber?: string;
  panNumber: string;
  address: string;
  email: string;
  phone: string;
  aadharFrontUrl?: string;
  aadharBackUrl?: string;
  panImageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isDeleted: boolean;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
