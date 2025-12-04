import mongoose, { Document, Schema } from 'mongoose';

export interface IVendorPackage extends Document {
  name: string;
  description: string;
  price: number;
  duration: number; // in days
  durationType: 'days' | 'months' | 'years';
  features: string[];
  serviceType: 'film_trade';
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const VendorPackageSchema = new Schema<IVendorPackage>({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, default: 30 },
  durationType: { type: String, enum: ['days', 'months', 'years'], default: 'days' },
  features: [{ type: String }],
  serviceType: { type: String, enum: ['film_trade'], default: 'film_trade' },
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const VendorPackage = mongoose.model<IVendorPackage>('VendorPackage', VendorPackageSchema);
