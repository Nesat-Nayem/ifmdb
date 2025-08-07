"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTransaction = exports.ETicket = exports.Booking = exports.Showtime = exports.Seat = exports.CinemaHall = exports.Cinema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Cinema Schema
const CinemaSchema = new mongoose_1.Schema({
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
const CinemaHallSchema = new mongoose_1.Schema({
    cinemaId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const SeatSchema = new mongoose_1.Schema({
    hallId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const ShowtimeSchema = new mongoose_1.Schema({
    movieId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    hallId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
            type: mongoose_1.default.Schema.Types.ObjectId,
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
const BookingSchema = new mongoose_1.Schema({
    showtimeId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Showtime',
        required: true
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
                type: mongoose_1.default.Schema.Types.ObjectId,
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
const ETicketSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const PaymentTransactionSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.Mixed
    },
    processedAt: {
        type: Date
    }
}, {
    timestamps: true
});
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
const Cinema = mongoose_1.default.model('Cinema', CinemaSchema);
exports.Cinema = Cinema;
const CinemaHall = mongoose_1.default.model('CinemaHall', CinemaHallSchema);
exports.CinemaHall = CinemaHall;
const Seat = mongoose_1.default.model('Seat', SeatSchema);
exports.Seat = Seat;
const Showtime = mongoose_1.default.model('Showtime', ShowtimeSchema);
exports.Showtime = Showtime;
const Booking = mongoose_1.default.model('Booking', BookingSchema);
exports.Booking = Booking;
const ETicket = mongoose_1.default.model('ETicket', ETicketSchema);
exports.ETicket = ETicket;
const PaymentTransaction = mongoose_1.default.model('PaymentTransaction', PaymentTransactionSchema);
exports.PaymentTransaction = PaymentTransaction;
