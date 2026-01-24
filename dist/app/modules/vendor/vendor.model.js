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
exports.VendorApplication = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SelectedServiceSchema = new mongoose_1.Schema({
    serviceType: { type: String, enum: ['film_trade', 'events', 'movie_watch'], required: true },
    packageId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'VendorPackage' },
    packageName: { type: String },
    packagePrice: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    isGovernmentEvent: { type: Boolean, default: false }, // Government events have fixed 10% platform fee
}, { _id: false });
const PaymentInfoSchema = new mongoose_1.Schema({
    transactionId: { type: String },
    amount: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentMethod: { type: String },
    paidAt: { type: Date },
}, { _id: false });
const VendorApplicationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    vendorName: { type: String, required: true },
    businessType: { type: String, required: true },
    gstNumber: { type: String, default: '' },
    country: { type: String, required: true, default: 'IN' },
    address: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    // India specific KYC
    aadharFrontUrl: { type: String, default: '' },
    aadharBackUrl: { type: String, default: '' },
    panImageUrl: { type: String, default: '' },
    // International KYC
    nationalIdUrl: { type: String, default: '' },
    passportUrl: { type: String, default: '' },
    // Services and payment
    selectedServices: { type: [SelectedServiceSchema], default: [] },
    paymentInfo: { type: PaymentInfoSchema },
    requiresPayment: { type: Boolean, default: false },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectionReason: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false, index: true },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    vendorUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
VendorApplicationSchema.index({ email: 1, status: 1 });
VendorApplicationSchema.index({ userId: 1, status: 1 });
exports.VendorApplication = mongoose_1.default.model('VendorApplication', VendorApplicationSchema);
