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
  seatType: {
    type: String,
    required: true,
    default: 'Normal'
  },
  // Booking type - either a regular "ticket" (single day) or a multi-day "pass"
  bookingType: {
    type: String,
    enum: ['ticket', 'pass'],
    default: 'ticket',
    required: true,
  },
  // For pass bookings: the name of the selected event pass
  eventPass: {
    type: String,
    default: '',
  },
  // For pass bookings: snapshot of pass perks at the time of purchase.
  // Snapshotting prevents perk changes by the vendor from affecting issued passes.
  passPerks: {
    foodIncluded: { type: Boolean, default: false },
    parkingAvailable: { type: Boolean, default: false },
    description: { type: String, default: '' },
  },
  eventCategory: {
    type: String,
    required: true,
    default: 'Ticket Booking'
  },
  // Attendance date - the specific day the user plans to attend (for multi-day events)
  // For single-day events this will be the event's startDate
  attendanceDate: {
    type: Date,
    default: null,
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
    enum: ['pending', 'confirmed', 'cancelled', 'expired'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'wallet', 'upi', 'netbanking', 'cash', 'cashfree', 'razorpay'],
    default: 'razorpay',
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
  ticketScannerId: {
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
  // For "ticket" bookings, isUsed becomes true once the ticket is scanned.
  // For "pass" bookings, isUsed only becomes true when the pass has been
  // scanned for every day of the event (see passUsageHistory below).
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  scanLocation: {
    type: String,
    default: '',
  },
  // Multi-day pass scan history. Each entry represents one day the pass was
  // scanned at the venue gate. A pass can only be scanned ONCE per day.
  passUsageHistory: {
    type: [
      new Schema(
        {
          // The event day (UTC midnight) this scan corresponds to
          dayDate: { type: Date, required: true },
          scannedAt: { type: Date, default: Date.now },
          scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          scanLocation: { type: String, default: '' },
        },
        { _id: false },
      ),
    ],
    default: [],
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
    enum: ['stripe', 'razorpay', 'paypal', 'paytm', 'cashfree'],
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
    enum: ['pending', 'completed', 'success', 'failed', 'cancelled'],
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
// EventBookingSchema.index({ bookingReference: 1 }, { unique: true });
EventBookingSchema.index({ paymentStatus: 1 });
EventBookingSchema.index({ bookingStatus: 1 });

EventETicketSchema.index({ bookingId: 1 });
// EventETicketSchema.index({ ticketNumber: 1 }, { unique: true });
// EventETicketSchema.index({ ticketScannerId: 1 }, { unique: true });

EventPaymentTransactionSchema.index({ bookingId: 1 });
EventPaymentTransactionSchema.index({ gatewayTransactionId: 1 });

// Interfaces
export interface IEventBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  bookingReference: string;
  quantity: number;
  seatType: string;
  bookingType: 'ticket' | 'pass';
  eventPass?: string;
  passPerks?: {
    foodIncluded: boolean;
    parkingAvailable: boolean;
    description: string;
  };
  eventCategory: string;
  attendanceDate?: Date | null;
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
  ticketScannerId: string;
  qrCodeData: string;
  qrCodeImageUrl: string;
  quantity: number;
  isUsed: boolean;
  usedAt?: Date;
  scannedBy?: mongoose.Types.ObjectId;
  scanLocation?: string;
  passUsageHistory?: Array<{
    dayDate: Date;
    scannedAt: Date;
    scannedBy?: mongoose.Types.ObjectId;
    scanLocation?: string;
  }>;
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
