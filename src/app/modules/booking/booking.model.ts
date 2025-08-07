import mongoose, { Document, Schema } from 'mongoose';

// Cinema Schema
const CinemaSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: ''
  },
  postalCode: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  facilities: [{
    type: String // 'parking', 'food_court', 'wheelchair_accessible', etc.
  }],
  isActive: {
    type: Boolean,
    default: true
  }
});

// Cinema Hall Schema
const CinemaHallSchema = new Schema({
  cinemaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cinema',
    required: true
  },
  hallName: {
    type: String,
    required: true
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  hallType: {
    type: String,
    enum: ['standard', 'premium', 'imax', '4dx', 'dolby'],
    default: 'standard'
  },
  screenType: {
    type: String,
    enum: ['2D', '3D', 'IMAX'],
    default: '2D'
  },
  seatLayout: {
    rows: {
      type: Number,
      required: true
    },
    seatsPerRow: {
      type: Number,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Seat Schema
const SeatSchema = new Schema({
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CinemaHall',
    required: true
  },
  rowLabel: {
    type: String,
    required: true // 'A', 'B', 'C', etc.
  },
  seatNumber: {
    type: Number,
    required: true
  },
  seatType: {
    type: String,
    enum: ['standard', 'premium', 'vip', 'wheelchair'],
    default: 'standard'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  priceMultiplier: {
    type: Number,
    default: 1.0 // Multiplier for base price
  }
});

// Showtime Schema
const ShowtimeSchema = new Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CinemaHall',
    required: true
  },
  showDate: {
    type: Date,
    required: true
  },
  showTime: {
    type: String,
    required: true // '10:30 AM', '2:15 PM', etc.
  },
  endTime: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  formatType: {
    type: String,
    enum: ['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema'],
    default: '2D'
  },
  language: {
    type: String,
    required: true
  },
  availableSeats: {
    type: Number,
    required: true
  },
  bookedSeats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat'
  }],
  status: {
    type: String,
    enum: ['active', 'cancelled', 'housefull'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Booking Schema
const BookingSchema = new Schema({
  showtimeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Showtime',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingReference: {
    type: String,
    required: true,
    unique: true
  },
  selectedSeats: [{
    seatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seat',
      required: true
    },
    rowLabel: {
      type: String,
      required: true
    },
    seatNumber: {
      type: Number,
      required: true
    },
    seatType: {
      type: String,
      required: true
    },
    seatPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  bookingFee: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'expired'],
    default: 'confirmed'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'wallet', 'upi', 'netbanking', 'cash'],
    default: 'card'
  },
  transactionId: {
    type: String,
    default: ''
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  customerDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
});

// E-Ticket Schema
const ETicketSchema = new Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  qrCodeData: {
    type: String,
    required: true
  },
  qrCodeImageUrl: {
    type: String,
    default: ''
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Payment Transaction Schema
const PaymentTransactionSchema = new Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'razorpay', 'paypal', 'paytm'],
    required: true
  },
  gatewayTransactionId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Interfaces
export interface ICinema extends Document {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  facilities: string[];
  isActive: boolean;
}

export interface ICinemaHall extends Document {
  cinemaId: mongoose.Types.ObjectId;
  hallName: string;
  totalSeats: number;
  hallType: string;
  screenType: string;
  seatLayout: {
    rows: number;
    seatsPerRow: number;
  };
  isActive: boolean;
}

export interface ISeat extends Document {
  hallId: mongoose.Types.ObjectId;
  rowLabel: string;
  seatNumber: number;
  seatType: string;
  isAvailable: boolean;
  priceMultiplier: number;
}

export interface IShowtime extends Document {
  movieId: mongoose.Types.ObjectId;
  hallId: mongoose.Types.ObjectId;
  showDate: Date;
  showTime: string;
  endTime: string;
  basePrice: number;
  formatType: string;
  language: string;
  availableSeats: number;
  bookedSeats: mongoose.Types.ObjectId[];
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking extends Document {
  showtimeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  bookingReference: string;
  selectedSeats: Array<{
    seatId: mongoose.Types.ObjectId;
    rowLabel: string;
    seatNumber: number;
    seatType: string;
    seatPrice: number;
  }>;
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
  expiresAt: Date;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IETicket extends Document {
  bookingId: mongoose.Types.ObjectId;
  ticketNumber: string;
  qrCodeData: string;
  qrCodeImageUrl: string;
  isUsed: boolean;
  usedAt: Date;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentTransaction extends Document {
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

// Create indexes
CinemaSchema.index({ city: 1 });
CinemaSchema.index({ isActive: 1 });

CinemaHallSchema.index({ cinemaId: 1 });
CinemaHallSchema.index({ isActive: 1 });

SeatSchema.index({ hallId: 1, rowLabel: 1, seatNumber: 1 }, { unique: true });

ShowtimeSchema.index({ movieId: 1 });
ShowtimeSchema.index({ hallId: 1 });
ShowtimeSchema.index({ showDate: 1, showTime: 1 });
ShowtimeSchema.index({ status: 1, isActive: 1 });

BookingSchema.index({ userId: 1 });
BookingSchema.index({ showtimeId: 1 });
BookingSchema.index({ bookingReference: 1 }, { unique: true });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ bookingStatus: 1 });

ETicketSchema.index({ bookingId: 1 });
ETicketSchema.index({ ticketNumber: 1 }, { unique: true });

PaymentTransactionSchema.index({ bookingId: 1 });
PaymentTransactionSchema.index({ gatewayTransactionId: 1 });

// Create models
const Cinema = mongoose.model<ICinema>('Cinema', CinemaSchema);
const CinemaHall = mongoose.model<ICinemaHall>('CinemaHall', CinemaHallSchema);
const Seat = mongoose.model<ISeat>('Seat', SeatSchema);
const Showtime = mongoose.model<IShowtime>('Showtime', ShowtimeSchema);
const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
const ETicket = mongoose.model<IETicket>('ETicket', ETicketSchema);
const PaymentTransaction = mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);

export { Cinema, CinemaHall, Seat, Showtime, Booking, ETicket, PaymentTransaction };
