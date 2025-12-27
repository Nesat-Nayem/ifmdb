"use strict";
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
exports.WalletController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const wallet_model_1 = require("./wallet.model");
const platformSettings_model_1 = require("../vendor/platformSettings.model");
const razorpayPayoutService_1 = __importDefault(require("../../services/razorpayPayoutService"));
// ==================== WALLET CONTROLLERS ====================
// Get or Create Wallet for User
const getOrCreateWallet = (userId, userType) => __awaiter(void 0, void 0, void 0, function* () {
    let wallet = yield wallet_model_1.Wallet.findOne({ userId });
    if (!wallet) {
        wallet = yield wallet_model_1.Wallet.create({
            userId,
            userType,
            balance: 0,
            pendingBalance: 0,
            totalEarnings: 0,
            totalWithdrawn: 0
        });
    }
    return wallet;
});
// Get My Wallet
const getMyWallet = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const wallet = yield getOrCreateWallet(user._id, user.role);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Wallet retrieved successfully',
        data: wallet,
    });
}));
// Get Wallet Dashboard Stats (Daily, Weekly, Monthly, Yearly)
const getWalletStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const user = req.user;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const wallet = yield getOrCreateWallet(user._id, user.role);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    // Get earnings for different periods
    const [dailyEarnings, weeklyEarnings, monthlyEarnings, yearlyEarnings] = yield Promise.all([
        wallet_model_1.WalletTransaction.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(user._id),
                    type: { $in: ['credit', 'pending_credit', 'pending_to_available'] },
                    status: 'completed',
                    createdAt: { $gte: startOfDay }
                }
            },
            { $group: { _id: null, total: { $sum: '$netAmount' } } }
        ]),
        wallet_model_1.WalletTransaction.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(user._id),
                    type: { $in: ['credit', 'pending_credit', 'pending_to_available'] },
                    status: 'completed',
                    createdAt: { $gte: startOfWeek }
                }
            },
            { $group: { _id: null, total: { $sum: '$netAmount' } } }
        ]),
        wallet_model_1.WalletTransaction.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(user._id),
                    type: { $in: ['credit', 'pending_credit', 'pending_to_available'] },
                    status: 'completed',
                    createdAt: { $gte: startOfMonth }
                }
            },
            { $group: { _id: null, total: { $sum: '$netAmount' } } }
        ]),
        wallet_model_1.WalletTransaction.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(user._id),
                    type: { $in: ['credit', 'pending_credit', 'pending_to_available'] },
                    status: 'completed',
                    createdAt: { $gte: startOfYear }
                }
            },
            { $group: { _id: null, total: { $sum: '$netAmount' } } }
        ])
    ]);
    // Get earnings by service type
    const earningsByService = yield wallet_model_1.WalletTransaction.aggregate([
        {
            $match: {
                userId: new mongoose_1.default.Types.ObjectId(user._id),
                type: { $in: ['credit', 'pending_credit', 'pending_to_available'] },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$serviceType',
                total: { $sum: '$netAmount' },
                count: { $sum: 1 }
            }
        }
    ]);
    // Get recent transactions
    const recentTransactions = yield wallet_model_1.WalletTransaction.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(10);
    // Get pending withdrawals count
    const pendingWithdrawals = yield wallet_model_1.WithdrawalRequest.countDocuments({
        userId: user._id,
        status: 'pending'
    });
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Wallet stats retrieved successfully',
        data: {
            wallet,
            earnings: {
                daily: ((_a = dailyEarnings[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
                weekly: ((_b = weeklyEarnings[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
                monthly: ((_c = monthlyEarnings[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
                yearly: ((_d = yearlyEarnings[0]) === null || _d === void 0 ? void 0 : _d.total) || 0
            },
            earningsByService: earningsByService.reduce((acc, item) => {
                acc[item._id || 'other'] = { total: item.total, count: item.count };
                return acc;
            }, {}),
            recentTransactions,
            pendingWithdrawals
        },
    });
}));
// Get Wallet Transactions with Pagination
const getWalletTransactions = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { page = 1, limit = 20, type, status, serviceType, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const query = { userId: user._id };
    if (type)
        query.type = type;
    if (status)
        query.status = status;
    if (serviceType)
        query.serviceType = serviceType;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate)
            query.createdAt.$gte = new Date(startDate);
        if (endDate)
            query.createdAt.$lte = new Date(endDate);
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = yield Promise.all([
        wallet_model_1.WalletTransaction.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit)),
        wallet_model_1.WalletTransaction.countDocuments(query)
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
}));
// Update Bank Details
const updateBankDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId } = req.body;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const wallet = yield wallet_model_1.Wallet.findOneAndUpdate({ userId: user._id }, {
        bankDetails: {
            accountHolderName,
            accountNumber,
            ifscCode,
            bankName,
            branchName: branchName || '',
            upiId: upiId || ''
        }
    }, { new: true });
    if (!wallet) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Wallet not found',
            data: null,
        });
    }
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Bank details updated successfully',
        data: wallet,
    });
}));
// ==================== WITHDRAWAL CONTROLLERS ====================
// Request Withdrawal
const requestWithdrawal = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = req.user;
    const { amount } = req.body;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const wallet = yield wallet_model_1.Wallet.findOne({ userId: user._id });
    if (!wallet) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Wallet not found',
            data: null,
        });
    }
    // Check if bank details are complete
    if (!((_a = wallet.bankDetails) === null || _a === void 0 ? void 0 : _a.accountNumber) || !((_b = wallet.bankDetails) === null || _b === void 0 ? void 0 : _b.ifscCode)) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Please add your bank details before requesting withdrawal',
            data: null,
        });
    }
    // Check available balance
    if (wallet.balance < amount) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: `Insufficient balance. Available: ₹${wallet.balance.toFixed(2)}`,
            data: null,
        });
    }
    // Minimum withdrawal check
    if (amount < 100) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Minimum withdrawal amount is ₹100',
            data: null,
        });
    }
    // Check for pending withdrawals
    const pendingWithdrawal = yield wallet_model_1.WithdrawalRequest.findOne({
        userId: user._id,
        status: { $in: ['pending', 'processing'] }
    });
    if (pendingWithdrawal) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'You already have a pending withdrawal request',
            data: null,
        });
    }
    // Create withdrawal request
    const withdrawalRequest = yield wallet_model_1.WithdrawalRequest.create({
        walletId: wallet._id,
        userId: user._id,
        amount,
        bankDetails: wallet.bankDetails,
        status: 'processing' // Changed from 'pending' to 'processing'
    });
    // Deduct from wallet balance immediately
    wallet.balance -= amount;
    yield wallet.save();
    // Create transaction record
    const transaction = yield wallet_model_1.WalletTransaction.create({
        walletId: wallet._id,
        userId: user._id,
        type: 'debit',
        amount,
        platformFee: 0,
        netAmount: amount,
        description: `Withdrawal request #${withdrawalRequest._id}`,
        referenceType: 'withdrawal',
        referenceId: withdrawalRequest._id,
        status: 'pending'
    });
    // ✅ AUTOMATIC RAZORPAY PAYOUT - Process withdrawal immediately
    try {
        if (!razorpayPayoutService_1.default.isPayoutsConfigured()) {
            throw new Error('Razorpay Payouts not configured. Please contact admin.');
        }
        const payoutResult = yield razorpayPayoutService_1.default.processWithdrawal(withdrawalRequest._id.toString(), user._id.toString(), amount, {
            accountHolderName: wallet.bankDetails.accountHolderName,
            accountNumber: wallet.bankDetails.accountNumber,
            ifscCode: wallet.bankDetails.ifscCode,
            bankName: wallet.bankDetails.bankName,
        }, user.email, user.phone || '0000000000');
        if (payoutResult.success) {
            // Update withdrawal request with Razorpay details
            withdrawalRequest.gatewayTransactionId = payoutResult.transferId;
            withdrawalRequest.gatewayResponse = payoutResult.gatewayResponse;
            withdrawalRequest.status = 'processing'; // Will be updated to 'completed' via webhook
            yield withdrawalRequest.save();
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.CREATED,
                success: true,
                message: 'Withdrawal initiated successfully. Funds will be transferred to your bank within 24 hours.',
                data: Object.assign(Object.assign({}, withdrawalRequest.toObject()), { transferId: payoutResult.transferId, estimatedTime: '24 hours' }),
            });
        }
        else {
            // Payout failed - refund to wallet
            withdrawalRequest.status = 'failed';
            withdrawalRequest.failureReason = payoutResult.message;
            withdrawalRequest.gatewayResponse = payoutResult.gatewayResponse;
            yield withdrawalRequest.save();
            // Refund amount back to wallet
            wallet.balance += amount;
            yield wallet.save();
            // Update transaction status
            transaction.status = 'failed';
            yield transaction.save();
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: `Withdrawal failed: ${payoutResult.message}`,
                data: null,
            });
        }
    }
    catch (error) {
        console.error('Razorpay Payout Error:', error);
        // Payout failed - refund to wallet
        withdrawalRequest.status = 'failed';
        withdrawalRequest.failureReason = error.message || 'Payout service error';
        yield withdrawalRequest.save();
        // Refund amount back to wallet
        wallet.balance += amount;
        yield wallet.save();
        // Update transaction status
        transaction.status = 'failed';
        yield transaction.save();
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message || 'Failed to process withdrawal. Amount has been refunded to your wallet.',
            data: null,
        });
    }
}));
// Get My Withdrawal History
const getMyWithdrawals = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { page = 1, limit = 20, status } = req.query;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const query = { userId: user._id };
    if (status)
        query.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [withdrawals, total] = yield Promise.all([
        wallet_model_1.WithdrawalRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        wallet_model_1.WithdrawalRequest.countDocuments(query)
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Withdrawals retrieved successfully',
        data: withdrawals,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
}));
// Cancel Withdrawal Request
const cancelWithdrawal = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Unauthorized',
            data: null,
        });
    }
    const withdrawal = yield wallet_model_1.WithdrawalRequest.findOne({
        _id: id,
        userId: user._id,
        status: 'pending'
    });
    if (!withdrawal) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Withdrawal request not found or cannot be cancelled',
            data: null,
        });
    }
    // Refund to wallet
    const wallet = yield wallet_model_1.Wallet.findById(withdrawal.walletId);
    if (wallet) {
        wallet.balance += withdrawal.amount;
        yield wallet.save();
    }
    // Update withdrawal status
    withdrawal.status = 'cancelled';
    yield withdrawal.save();
    // Update transaction
    yield wallet_model_1.WalletTransaction.findOneAndUpdate({ referenceId: withdrawal._id, referenceType: 'withdrawal' }, { status: 'cancelled' });
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Withdrawal request cancelled successfully',
        data: withdrawal,
    });
}));
// ==================== ADMIN CONTROLLERS ====================
// Get All Wallets (Admin)
const getAllWallets = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 20, userType, search } = req.query;
    const query = {};
    if (userType)
        query.userType = userType;
    const skip = (Number(page) - 1) * Number(limit);
    const [wallets, total] = yield Promise.all([
        wallet_model_1.Wallet.find(query)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        wallet_model_1.Wallet.countDocuments(query)
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Wallets retrieved successfully',
        data: wallets,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
}));
// Get All Withdrawal Requests (Admin)
const getAllWithdrawals = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status)
        query.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [withdrawals, total] = yield Promise.all([
        wallet_model_1.WithdrawalRequest.find(query)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        wallet_model_1.WithdrawalRequest.countDocuments(query)
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Withdrawals retrieved successfully',
        data: withdrawals,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
}));
// Process Withdrawal (Admin)
const processWithdrawal = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status, gatewayTransactionId, adminNotes, failureReason } = req.body;
    const withdrawal = yield wallet_model_1.WithdrawalRequest.findById(id);
    if (!withdrawal) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Withdrawal request not found',
            data: null,
        });
    }
    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Withdrawal request cannot be processed',
            data: null,
        });
    }
    withdrawal.status = status;
    if (gatewayTransactionId)
        withdrawal.gatewayTransactionId = gatewayTransactionId;
    if (adminNotes)
        withdrawal.adminNotes = adminNotes;
    if (failureReason)
        withdrawal.failureReason = failureReason;
    if (status === 'completed') {
        withdrawal.processedAt = new Date();
        // Update wallet total withdrawn
        const wallet = yield wallet_model_1.Wallet.findById(withdrawal.walletId);
        if (wallet) {
            wallet.totalWithdrawn += withdrawal.amount;
            yield wallet.save();
        }
        // Update transaction status
        yield wallet_model_1.WalletTransaction.findOneAndUpdate({ referenceId: withdrawal._id, referenceType: 'withdrawal' }, { status: 'completed' });
    }
    else if (status === 'failed') {
        // Refund to wallet
        const wallet = yield wallet_model_1.Wallet.findById(withdrawal.walletId);
        if (wallet) {
            wallet.balance += withdrawal.amount;
            yield wallet.save();
        }
        // Update transaction status
        yield wallet_model_1.WalletTransaction.findOneAndUpdate({ referenceId: withdrawal._id, referenceType: 'withdrawal' }, { status: 'failed' });
    }
    yield withdrawal.save();
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Withdrawal request processed successfully',
        data: withdrawal,
    });
}));
// Get Admin Wallet Stats
const getAdminWalletStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Get platform earnings (admin's share from platform fees)
    const [totalPlatformEarnings, dailyPlatformEarnings, monthlyPlatformEarnings, totalVendorPayouts, pendingWithdrawals, totalVendors] = yield Promise.all([
        wallet_model_1.WalletTransaction.aggregate([
            {
                $match: {
                    type: 'platform_fee',
                    status: 'completed'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        wallet_model_1.WalletTransaction.aggregate([
            {
                $match: {
                    type: 'platform_fee',
                    status: 'completed',
                    createdAt: { $gte: startOfDay }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        wallet_model_1.WalletTransaction.aggregate([
            {
                $match: {
                    type: 'platform_fee',
                    status: 'completed',
                    createdAt: { $gte: startOfMonth }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        wallet_model_1.WithdrawalRequest.aggregate([
            {
                $match: { status: 'completed' }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        wallet_model_1.WithdrawalRequest.countDocuments({ status: 'pending' }),
        wallet_model_1.Wallet.countDocuments({ userType: 'vendor' })
    ]);
    // Platform fee breakdown by service
    const platformFeeByService = yield wallet_model_1.WalletTransaction.aggregate([
        {
            $match: {
                type: 'platform_fee',
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$serviceType',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Admin wallet stats retrieved successfully',
        data: {
            totalPlatformEarnings: ((_a = totalPlatformEarnings[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
            dailyPlatformEarnings: ((_b = dailyPlatformEarnings[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
            monthlyPlatformEarnings: ((_c = monthlyPlatformEarnings[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
            totalVendorPayouts: ((_d = totalVendorPayouts[0]) === null || _d === void 0 ? void 0 : _d.total) || 0,
            pendingWithdrawals,
            totalVendors,
            platformFeeByService: platformFeeByService.reduce((acc, item) => {
                acc[item._id || 'other'] = { total: item.total, count: item.count };
                return acc;
            }, {})
        },
    });
}));
// ==================== EARNING CREDIT HELPER ====================
// Credit earnings to vendor wallet (called after successful payment)
const creditVendorEarnings = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { vendorId, amount, serviceType, referenceType, referenceId, metadata } = params;
    // Get platform fee settings
    const feeKey = serviceType === 'events' ? 'event_platform_fee' : 'movie_watch_platform_fee';
    const platformFeeSetting = yield platformSettings_model_1.PlatformSettings.findOne({ key: feeKey });
    const platformFeePercentage = (platformFeeSetting === null || platformFeeSetting === void 0 ? void 0 : platformFeeSetting.value) || (serviceType === 'events' ? 20 : 50);
    // Calculate amounts
    const platformFee = (amount * platformFeePercentage) / 100;
    const vendorEarnings = amount - platformFee;
    // Get or create vendor wallet
    const wallet = yield getOrCreateWallet(vendorId, 'vendor');
    // Calculate available date (7 days from now)
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 7);
    // Add to pending balance
    wallet.pendingBalance += vendorEarnings;
    wallet.totalEarnings += vendorEarnings;
    yield wallet.save();
    // Create pending transaction for vendor
    yield wallet_model_1.WalletTransaction.create({
        walletId: wallet._id,
        userId: vendorId,
        type: 'pending_credit',
        amount,
        platformFee,
        netAmount: vendorEarnings,
        description: `${serviceType === 'events' ? 'Event booking' : 'Video purchase'} earnings (available after 7 days)`,
        referenceType,
        referenceId,
        serviceType,
        status: 'completed',
        availableAt,
        metadata
    });
    // Create platform fee transaction for admin tracking
    yield wallet_model_1.WalletTransaction.create({
        walletId: wallet._id,
        userId: vendorId,
        type: 'platform_fee',
        amount: platformFee,
        platformFee: 0,
        netAmount: platformFee,
        description: `Platform fee (${platformFeePercentage}%) from ${serviceType === 'events' ? 'event booking' : 'video purchase'}`,
        referenceType,
        referenceId,
        serviceType,
        status: 'completed',
        metadata
    });
    return { vendorEarnings, platformFee, availableAt };
});
// Move pending funds to available balance (called by cron job)
const processPendingFunds = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    // Find all pending transactions that are now available
    const pendingTransactions = yield wallet_model_1.WalletTransaction.find({
        type: 'pending_credit',
        status: 'completed',
        availableAt: { $lte: now }
    });
    for (const transaction of pendingTransactions) {
        const wallet = yield wallet_model_1.Wallet.findById(transaction.walletId);
        if (wallet) {
            // Move from pending to available
            wallet.pendingBalance -= transaction.netAmount;
            wallet.balance += transaction.netAmount;
            yield wallet.save();
            // Create a record of the transfer
            yield wallet_model_1.WalletTransaction.create({
                walletId: wallet._id,
                userId: transaction.userId,
                type: 'pending_to_available',
                amount: transaction.netAmount,
                platformFee: 0,
                netAmount: transaction.netAmount,
                description: 'Pending funds now available for withdrawal',
                referenceType: transaction.referenceType,
                referenceId: transaction.referenceId,
                serviceType: transaction.serviceType,
                status: 'completed'
            });
            // Mark original transaction as processed by changing type
            transaction.type = 'credit';
            yield transaction.save();
        }
    }
    return pendingTransactions.length;
});
// Handle refund - deduct from vendor wallet
const handleRefund = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { vendorId, amount, serviceType, referenceType, referenceId, metadata } = params;
    const wallet = yield wallet_model_1.Wallet.findOne({ userId: vendorId });
    if (!wallet)
        return null;
    // Get platform fee settings
    const feeKey = serviceType === 'events' ? 'event_platform_fee' : 'movie_watch_platform_fee';
    const platformFeeSetting = yield platformSettings_model_1.PlatformSettings.findOne({ key: feeKey });
    const platformFeePercentage = (platformFeeSetting === null || platformFeeSetting === void 0 ? void 0 : platformFeeSetting.value) || (serviceType === 'events' ? 20 : 50);
    // Calculate vendor's share that was credited
    const platformFee = (amount * platformFeePercentage) / 100;
    const vendorShare = amount - platformFee;
    // First try to deduct from pending balance
    if (wallet.pendingBalance >= vendorShare) {
        wallet.pendingBalance -= vendorShare;
    }
    else {
        // Deduct remaining from available balance
        const remainingToDeduct = vendorShare - wallet.pendingBalance;
        wallet.pendingBalance = 0;
        wallet.balance = Math.max(0, wallet.balance - remainingToDeduct);
    }
    wallet.totalEarnings -= vendorShare;
    yield wallet.save();
    // Create refund transaction
    yield wallet_model_1.WalletTransaction.create({
        walletId: wallet._id,
        userId: vendorId,
        type: 'debit',
        amount: vendorShare,
        platformFee: 0,
        netAmount: vendorShare,
        description: `Refund for ${serviceType === 'events' ? 'event booking' : 'video purchase'}`,
        referenceType: 'refund',
        referenceId,
        serviceType,
        status: 'completed',
        metadata
    });
    return { refundedAmount: vendorShare };
});
exports.WalletController = {
    // Vendor/User
    getMyWallet,
    getWalletStats,
    getWalletTransactions,
    updateBankDetails,
    requestWithdrawal,
    getMyWithdrawals,
    cancelWithdrawal,
    // Admin
    getAllWallets,
    getAllWithdrawals,
    processWithdrawal,
    getAdminWalletStats,
    // Helpers (for use in other controllers)
    getOrCreateWallet,
    creditVendorEarnings,
    processPendingFunds,
    handleRefund
};
