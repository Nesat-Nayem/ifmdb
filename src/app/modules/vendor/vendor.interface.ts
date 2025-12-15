import { Document, Types } from 'mongoose';

export type VendorServiceType = 'film_trade' | 'events' | 'movie_watch';

export interface ISelectedService {
  serviceType: VendorServiceType;
  packageId?: Types.ObjectId; // Only for film_trade
  packageName?: string;
  packagePrice?: number;
  platformFee?: number; // For events/movie_watch
}

export interface IPaymentInfo {
  transactionId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  paidAt?: Date;
}

export interface IVendorApplication extends Document {
  userId?: Types.ObjectId;
  vendorName: string;
  businessType: string;
  gstNumber?: string;
  country: string;
  address: string;
  email: string;
  phone: string;
  // India specific KYC
  aadharFrontUrl?: string;
  aadharBackUrl?: string;
  panImageUrl?: string;
  // International KYC
  nationalIdUrl?: string;
  passportUrl?: string;
  
  // New fields for services
  selectedServices: ISelectedService[];
  paymentInfo?: IPaymentInfo;
  requiresPayment: boolean;
  totalAmount: number;
  
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isDeleted: boolean;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  vendorUserId?: Types.ObjectId; // The created vendor user after approval
  createdAt: Date;
  updatedAt: Date;
}
