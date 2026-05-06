import { Document, Types } from 'mongoose';

export type VendorServiceType = 'film_trade' | 'events' | 'movie_watch';

export interface ISubscriptionPayment {
  transactionId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  paidAt?: Date;
  type: 'initial' | 'renewal';
  packageId?: Types.ObjectId;
  packageName?: string;
  durationDays?: number;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface ISelectedService {
  serviceType: VendorServiceType;
  packageId?: Types.ObjectId; // Only for film_trade
  packageName?: string;
  packagePrice?: number;
  platformFee?: number; // For events/movie_watch
  isGovernmentEvent?: boolean; // For events - government events have fixed 10% fee
  // ===== Subscription lifecycle (film_trade only) =====
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  subscriptionStatus?: 'active' | 'expired' | 'pending_payment';
  lastRenewedAt?: Date;
  paymentHistory?: ISubscriptionPayment[];
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
