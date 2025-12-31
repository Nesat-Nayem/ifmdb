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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketScanLog = exports.TicketScannerAccess = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// Ticket Scanner Access Schema - For vendors to create scanner accounts
const TicketScannerAccessSchema = new mongoose_1.Schema({
    // Reference to the vendor who created this scanner access
    vendorId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
            type: mongoose_1.default.Schema.Types.ObjectId,
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
TicketScannerAccessSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password'))
            return next();
        try {
            const salt = yield bcrypt_1.default.genSalt(10);
            this.password = yield bcrypt_1.default.hash(this.password, salt);
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
// Method to compare password
TicketScannerAccessSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return bcrypt_1.default.compare(candidatePassword, this.password);
    });
};
// Ticket Scan Log Schema - To track all scans
const TicketScanLogSchema = new mongoose_1.Schema({
    scannerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'TicketScannerAccess',
        required: true,
    },
    ticketId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'EventETicket',
    },
    bookingReference: {
        type: String,
        required: true,
    },
    eventId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
exports.TicketScannerAccess = mongoose_1.default.model('TicketScannerAccess', TicketScannerAccessSchema);
exports.TicketScanLog = mongoose_1.default.model('TicketScanLog', TicketScanLogSchema);
