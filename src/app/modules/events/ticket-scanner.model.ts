import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// Ticket Scanner Access Schema - For vendors to create scanner accounts
const TicketScannerAccessSchema = new Schema({
  // Reference to the vendor who created this scanner access
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Scanner account details
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  // Events this scanner can validate (empty array = all vendor events)
  allowedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  // Last activity tracking
  lastLoginAt: {
    type: Date,
  },
  lastScanAt: {
    type: Date,
  },
  totalScans: {
    type: Number,
    default: 0,
  },
  // Token for scanner sessions
  scannerToken: {
    type: String,
    default: '',
  },
  tokenExpiresAt: {
    type: Date,
  },
  // Device info
  deviceInfo: {
    type: String,
    default: '',
  },
  // Notes
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Hash password before saving
TicketScannerAccessSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
TicketScannerAccessSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ticket Scan Log Schema - To track all scans
const TicketScanLogSchema = new Schema({
  scannerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketScannerAccess',
    required: true,
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventETicket',
  },
  bookingReference: {
    type: String,
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
  scanResult: {
    type: String,
    enum: ['valid', 'invalid', 'already_used', 'expired', 'wrong_event', 'not_found'],
    required: true,
  },
  scanMessage: {
    type: String,
    default: '',
  },
  ticketDetails: {
    customerName: String,
    ticketType: String,
    quantity: Number,
    eventName: String,
    eventDate: Date,
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  deviceInfo: {
    type: String,
    default: '',
  },
  scannedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
TicketScannerAccessSchema.index({ vendorId: 1 });
TicketScannerAccessSchema.index({ email: 1 }, { unique: true });
TicketScannerAccessSchema.index({ isActive: 1 });

TicketScanLogSchema.index({ scannerId: 1 });
TicketScanLogSchema.index({ bookingReference: 1 });
TicketScanLogSchema.index({ eventId: 1 });
TicketScanLogSchema.index({ scannedAt: -1 });

// Interfaces
export interface ITicketScannerAccess extends Document {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  allowedEvents: mongoose.Types.ObjectId[];
  isActive: boolean;
  lastLoginAt?: Date;
  lastScanAt?: Date;
  totalScans: number;
  scannerToken: string;
  tokenExpiresAt?: Date;
  deviceInfo: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ITicketScanLog extends Document {
  scannerId: mongoose.Types.ObjectId;
  ticketId?: mongoose.Types.ObjectId;
  bookingReference: string;
  eventId?: mongoose.Types.ObjectId;
  scanResult: 'valid' | 'invalid' | 'already_used' | 'expired' | 'wrong_event' | 'not_found';
  scanMessage: string;
  ticketDetails?: {
    customerName?: string;
    ticketType?: string;
    quantity?: number;
    eventName?: string;
    eventDate?: Date;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  deviceInfo: string;
  scannedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const TicketScannerAccess = mongoose.model<ITicketScannerAccess>('TicketScannerAccess', TicketScannerAccessSchema);
export const TicketScanLog = mongoose.model<ITicketScanLog>('TicketScanLog', TicketScanLogSchema);
