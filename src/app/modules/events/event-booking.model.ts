import mongoose, { Document, Schema } from 'mongoose';

// Event Booking Schema
const EventBookingSchema = new Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingReference: {
    type: String,
    required: true,
    unique: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  bookingFee: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'expired'],
    default: 'confirmed',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'wallet', 'upi', 'netbanking', 'cash'],
    default: 'card',
  },
  transactionId: {
    type: String,
    default: '',
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
}, {
  timestamps: true,
});

// Event E-Ticket Schema
const EventETicketSchema = new Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventBooking',
    required: true,
  },
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
  },
  qrCodeData: {
    type: String,
    required: true,
  },
  qrCodeImageUrl: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Event Payment Transaction Schema
const EventPaymentTransactionSchema = new Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventBooking',
    required: true,
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'razorpay', 'paypal', 'paytm'],
    required: true,
  },
  gatewayTransactionId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
  },
  processedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
EventBookingSchema.index({ userId: 1 });
EventBookingSchema.index({ eventId: 1 });
EventBookingSchema.index({ bookingReference: 1 }, { unique: true });
EventBookingSchema.index({ paymentStatus: 1 });
EventBookingSchema.index({ bookingStatus: 1 });

EventETicketSchema.index({ bookingId: 1 });
EventETicketSchema.index({ ticketNumber: 1 }, { unique: true });

EventPaymentTransactionSchema.index({ bookingId: 1 });
EventPaymentTransactionSchema.index({ gatewayTransactionId: 1 });

// Interfaces
export interface IEventBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  bookingReference: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  bookingFee: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  paymentMethod: string;
  transactionId: string;
  bookedAt: Date;
  expiresAt?: Date;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventETicket extends Document {
  bookingId: mongoose.Types.ObjectId;
  ticketNumber: string;
  qrCodeData: string;
  qrCodeImageUrl: string;
  quantity: number;
  isUsed: boolean;
  usedAt?: Date;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventPaymentTransaction extends Document {
  bookingId: mongoose.Types.ObjectId;
  paymentGateway: string;
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  gatewayResponse: any;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const EventBooking = mongoose.model<IEventBooking>('EventBooking', EventBookingSchema);
export const EventETicket = mongoose.model<IEventETicket>('EventETicket', EventETicketSchema);
export const EventPaymentTransaction = mongoose.model<IEventPaymentTransaction>('EventPaymentTransaction', EventPaymentTransactionSchema);
