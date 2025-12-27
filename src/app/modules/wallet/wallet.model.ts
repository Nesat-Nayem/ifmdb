import mongoose, { Document, Schema } from 'mongoose';

// Wallet Interface
export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  userType: 'vendor' | 'admin';
  balance: number;
  pendingBalance: number; // Amount in 7-day hold
  totalEarnings: number;
  totalWithdrawn: number;
  currency: string;
  isActive: boolean;
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
    upiId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Wallet Schema
const walletSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    userType: {
      type: String,
      enum: ['vendor', 'admin'],
      required: true
    },
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    bankDetails: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      branchName: { type: String, default: '' },
      upiId: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

// Transaction Interface
export interface IWalletTransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'credit' | 'debit' | 'pending_credit' | 'pending_to_available' | 'platform_fee';
  amount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  description: string;
  referenceType: 'event_booking' | 'video_purchase' | 'withdrawal' | 'refund' | 'adjustment';
  referenceId?: mongoose.Types.ObjectId;
  serviceType?: 'events' | 'movie_watch' | 'film_trade';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  availableAt?: Date; // When pending funds become available (7 days after transaction)
  metadata?: {
    bookingId?: string;
    purchaseId?: string;
    customerName?: string;
    customerEmail?: string;
    itemTitle?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Schema
const walletTransactionSchema: Schema = new Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['credit', 'debit', 'pending_credit', 'pending_to_available', 'platform_fee'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    platformFee: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    description: {
      type: String,
      required: true
    },
    referenceType: {
      type: String,
      enum: ['event_booking', 'video_purchase', 'withdrawal', 'refund', 'adjustment'],
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    serviceType: {
      type: String,
      enum: ['events', 'movie_watch', 'film_trade']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    availableAt: {
      type: Date
    },
    metadata: {
      bookingId: { type: String },
      purchaseId: { type: String },
      customerName: { type: String },
      customerEmail: { type: String },
      itemTitle: { type: String }
    }
  },
  { timestamps: true }
);

// Withdrawal Request Interface
export interface IWithdrawalRequest extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
  };
  paymentGateway: string;
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  processedAt?: Date;
  failureReason?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Withdrawal Request Schema
const withdrawalRequestSchema: Schema = new Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    bankDetails: {
      accountHolderName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
      branchName: { type: String }
    },
    paymentGateway: {
      type: String,
      default: 'razorpay'
    },
    gatewayTransactionId: {
      type: String
    },
    gatewayResponse: {
      type: Schema.Types.Mixed
    },
    processedAt: {
      type: Date
    },
    failureReason: {
      type: String
    },
    adminNotes: {
      type: String
    }
  },
  { timestamps: true }
);

// Indexes
walletSchema.index({ userId: 1 }, { unique: true });
walletSchema.index({ userType: 1 });
walletTransactionSchema.index({ walletId: 1 });
walletTransactionSchema.index({ userId: 1 });
walletTransactionSchema.index({ type: 1 });
walletTransactionSchema.index({ status: 1 });
walletTransactionSchema.index({ availableAt: 1 });
walletTransactionSchema.index({ createdAt: -1 });
withdrawalRequestSchema.index({ walletId: 1 });
withdrawalRequestSchema.index({ userId: 1 });
withdrawalRequestSchema.index({ status: 1 });
withdrawalRequestSchema.index({ createdAt: -1 });

// Export models
export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);
export const WalletTransaction = mongoose.model<IWalletTransaction>('WalletTransaction', walletTransactionSchema);
export const WithdrawalRequest = mongoose.model<IWithdrawalRequest>('WithdrawalRequest', withdrawalRequestSchema);
