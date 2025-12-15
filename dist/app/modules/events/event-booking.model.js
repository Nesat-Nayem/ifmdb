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
exports.EventPaymentTransaction = exports.EventETicket = exports.EventBooking = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Event Booking Schema
const EventBookingSchema = new mongoose_1.Schema({
    eventId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        enum: ['card', 'wallet', 'upi', 'netbanking', 'cash', 'cashfree'],
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
const EventETicketSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
    isUsed: {
        type: Boolean,
        default: false,
    },
    usedAt: {
        type: Date,
    },
    scannedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    scanLocation: {
        type: String,
        default: '',
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Event Payment Transaction Schema
const EventPaymentTransactionSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        enum: ['pending', 'success', 'failed', 'cancelled'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    gatewayResponse: {
        type: mongoose_1.default.Schema.Types.Mixed,
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
exports.EventBooking = mongoose_1.default.model('EventBooking', EventBookingSchema);
exports.EventETicket = mongoose_1.default.model('EventETicket', EventETicketSchema);
exports.EventPaymentTransaction = mongoose_1.default.model('EventPaymentTransaction', EventPaymentTransactionSchema);
