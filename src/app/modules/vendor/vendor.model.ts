import mongoose, { Schema } from 'mongoose';
import { IVendorApplication, ISelectedService, IPaymentInfo, ISubscriptionPayment } from './vendor.interface';

const SubscriptionPaymentSchema = new Schema<ISubscriptionPayment>({
  transactionId: { type: String },
  amount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentMethod: { type: String },
  paidAt: { type: Date },
  type: { type: String, enum: ['initial', 'renewal'], default: 'initial' },
  packageId: { type: Schema.Types.ObjectId, ref: 'VendorPackage' },
  packageName: { type: String },
  durationDays: { type: Number },
  periodStart: { type: Date },
  periodEnd: { type: Date },
}, { _id: false });

const SelectedServiceSchema = new Schema<ISelectedService>({
  serviceType: { type: String, enum: ['film_trade', 'events', 'movie_watch'], required: true },
  packageId: { type: Schema.Types.ObjectId, ref: 'VendorPackage' },
  packageName: { type: String },
  packagePrice: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  isGovernmentEvent: { type: Boolean, default: false }, // Government events have fixed 10% platform fee
  // Subscription lifecycle (film_trade only)
  subscriptionStart: { type: Date },
  subscriptionEnd: { type: Date },
  subscriptionStatus: { type: String, enum: ['active', 'expired', 'pending_payment'], default: 'pending_payment' },
  lastRenewedAt: { type: Date },
  paymentHistory: { type: [SubscriptionPaymentSchema], default: [] },
}, { _id: false });

const PaymentInfoSchema = new Schema<IPaymentInfo>({
  transactionId: { type: String },
  amount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentMethod: { type: String },
  paidAt: { type: Date },
}, { _id: false });

const VendorApplicationSchema = new Schema<IVendorApplication>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  vendorName: { type: String, required: true },
  businessType: { type: String, required: true },
  gstNumber: { type: String, default: '' },
  country: { type: String, required: true, default: 'IN' },
  address: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  // India specific KYC
  aadharFrontUrl: { type: String, default: '' },
  aadharBackUrl: { type: String, default: '' },
  panImageUrl: { type: String, default: '' },
  // International KYC
  nationalIdUrl: { type: String, default: '' },
  passportUrl: { type: String, default: '' },
  
  // Services and payment
  selectedServices: { type: [SelectedServiceSchema], default: [] },
  paymentInfo: { type: PaymentInfoSchema },
  requiresPayment: { type: Boolean, default: false },
  totalAmount: { type: Number, default: 0 },
  
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejectionReason: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false, index: true },
  approvedAt: { type: Date },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  vendorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

VendorApplicationSchema.index({ email: 1, status: 1 });
VendorApplicationSchema.index({ userId: 1, status: 1 });

export const VendorApplication = mongoose.model<IVendorApplication>('VendorApplication', VendorApplicationSchema);
