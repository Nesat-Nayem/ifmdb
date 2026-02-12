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
exports.WithdrawalRequest = exports.WalletTransaction = exports.Wallet = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Wallet Schema
const walletSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
    },
    razorpayLinkedAccountId: {
        type: String,
        default: ''
    },
    razorpayAccountStatus: {
        type: String,
        enum: ['created', 'activated', 'suspended', 'failed', 'pending', ''],
        default: ''
    },
    razorpayProductId: {
        type: String,
        default: ''
    }
}, { timestamps: true });
// Transaction Schema
const walletTransactionSchema = new mongoose_1.Schema({
    walletId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.ObjectId
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
    razorpayTransferId: {
        type: String,
        default: ''
    },
    razorpayPaymentId: {
        type: String,
        default: ''
    },
    metadata: {
        bookingId: { type: String },
        purchaseId: { type: String },
        customerName: { type: String },
        customerEmail: { type: String },
        itemTitle: { type: String }
    }
}, { timestamps: true });
// Withdrawal Request Schema
const withdrawalRequestSchema = new mongoose_1.Schema({
    walletId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed
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
}, { timestamps: true });
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
exports.Wallet = mongoose_1.default.model('Wallet', walletSchema);
exports.WalletTransaction = mongoose_1.default.model('WalletTransaction', walletTransactionSchema);
exports.WithdrawalRequest = mongoose_1.default.model('WithdrawalRequest', withdrawalRequestSchema);
