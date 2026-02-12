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
const razorpayRouteService_1 = __importDefault(require("../../services/razorpayRouteService"));
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
    // Sync Razorpay Route account status if vendor has a linked account but not yet activated in DB
    if (wallet.razorpayLinkedAccountId &&
        wallet.razorpayAccountStatus !== 'activated' &&
        wallet.razorpayAccountStatus !== 'suspended' &&
        razorpayRouteService_1.default.isRouteConfigured()) {
        try {
            const fetchResult = yield razorpayRouteService_1.default.fetchLinkedAccount(wallet.razorpayLinkedAccountId);
            if (fetchResult.success && fetchResult.data) {
                const liveStatus = fetchResult.data.status;
                if (liveStatus === 'activated') {
                    wallet.razorpayAccountStatus = 'activated';
                    yield wallet.save();
                }
                else if (liveStatus === 'suspended') {
                    wallet.razorpayAccountStatus = 'suspended';
                    yield wallet.save();
                }
            }
        }
        catch (err) {
            // Non-critical - continue with existing status
        }
    }
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
// Update Bank Details & Create/Update Razorpay Linked Account for Route
const updateBankDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
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
    let wallet = yield getOrCreateWallet(user._id, user.role);
    // Update bank details
    wallet.bankDetails = {
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        branchName: branchName || '',
        upiId: upiId || ''
    };
    yield wallet.save();
    // Create Razorpay Linked Account for Route (only for vendors)
    if (user.role === 'vendor' && razorpayRouteService_1.default.isRouteConfigured()) {
        try {
            if (!wallet.razorpayLinkedAccountId || wallet.razorpayAccountStatus === 'failed') {
                // ===== FULL 4-STEP RAZORPAY ROUTE SETUP =====
                let accountId = wallet.razorpayLinkedAccountId; // May already exist from a previous partial attempt
                // Step 1: Create Linked Account
                // If retrying with a stale account, delete it first
                if (accountId && wallet.razorpayAccountStatus === 'failed') {
                    console.log(`Step 1 - Deleting stale linked account: ${accountId}`);
                    yield razorpayRouteService_1.default.deleteLinkedAccount(accountId);
                    accountId = null;
                    wallet.razorpayLinkedAccountId = '';
                    wallet.razorpayProductId = '';
                    yield wallet.save();
                }
                if (!accountId) {
                    const referenceId = razorpayRouteService_1.default.generateVendorReferenceId(user._id.toString());
                    const result = yield razorpayRouteService_1.default.createLinkedAccount({
                        email: user.email,
                        phone: user.phone || '9999999999',
                        legalBusinessName: accountHolderName || user.name || 'Vendor Business',
                        contactName: accountHolderName || user.name || 'Vendor',
                        businessType: 'individual',
                        referenceId,
                    });
                    if (result.success && result.accountId) {
                        accountId = result.accountId;
                        console.log(`Step 1 OK - Linked Account created: ${accountId}`);
                    }
                    else {
                        console.error('Step 1 FAILED - Create linked account:', result.message);
                        wallet.razorpayAccountStatus = 'failed';
                        yield wallet.save();
                    }
                }
                else {
                    console.log(`Step 1 SKIP - Linked Account already exists: ${accountId}`);
                }
                if (accountId) {
                    wallet.razorpayLinkedAccountId = accountId;
                    wallet.razorpayAccountStatus = 'created';
                    yield wallet.save();
                    // Small delay to let Razorpay process the account creation
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                    // Step 2: Create Stakeholder
                    // Use the SAME name as legalBusinessName for proprietorship consistency
                    const vendorName = accountHolderName || user.name || 'Vendor';
                    const stakeholderResult = yield razorpayRouteService_1.default.createStakeholder(accountId, {
                        name: vendorName,
                        email: user.email,
                        phone: user.phone || '9999999999',
                    });
                    if (stakeholderResult.success) {
                        console.log(`Step 2 OK - Stakeholder created for account: ${accountId}`);
                    }
                    else {
                        // Stakeholder might already exist from previous attempt - continue anyway
                        console.log(`Step 2 WARN - Stakeholder creation: ${stakeholderResult.message} (continuing...)`);
                    }
                    // Small delay before product configuration
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                    // Step 3: Request Product Configuration
                    let productId = wallet.razorpayProductId;
                    if (!productId) {
                        const productResult = yield razorpayRouteService_1.default.requestProductConfiguration(accountId);
                        if (productResult.success && ((_a = productResult.data) === null || _a === void 0 ? void 0 : _a.id)) {
                            productId = productResult.data.id;
                            wallet.razorpayProductId = productId;
                            yield wallet.save();
                            console.log(`Step 3 OK - Product config requested: ${productId}`);
                        }
                        else {
                            console.error('Step 3 FAILED - Product config:', productResult.message);
                        }
                    }
                    else {
                        console.log(`Step 3 SKIP - Product config already exists: ${productId}`);
                    }
                    // Small delay before updating product with bank details
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                    // Step 4: Update Product Configuration with bank details
                    if (productId) {
                        const updateResult = yield razorpayRouteService_1.default.updateProductConfiguration(accountId, productId, {
                            accountNumber,
                            ifscCode,
                            beneficiaryName: accountHolderName,
                        });
                        if (updateResult.success) {
                            const activationStatus = (_b = updateResult.data) === null || _b === void 0 ? void 0 : _b.activation_status;
                            console.log(`Step 4 OK - Product config updated, activation_status: ${activationStatus}`);
                            if (activationStatus !== 'activated') {
                                console.log('Product Config Requirements:', JSON.stringify((_c = updateResult.data) === null || _c === void 0 ? void 0 : _c.requirements, null, 2));
                                // Step 5: Explicitly submit the account for activation
                                console.log(`Step 5 - Submitting account ${accountId} for activation...`);
                                const submitResult = yield razorpayRouteService_1.default.submitAccount(accountId);
                                if (submitResult.success) {
                                    console.log('Step 5 OK - Account submitted for activation');
                                }
                                else {
                                    console.log('Step 5 WARN - Account submission:', submitResult.message);
                                }
                            }
                            if (activationStatus === 'activated') {
                                wallet.razorpayAccountStatus = 'activated';
                            }
                            else {
                                // Fetch actual account status from Razorpay
                                const accountCheck = yield razorpayRouteService_1.default.fetchLinkedAccount(accountId);
                                if (accountCheck.success && accountCheck.data) {
                                    const liveStatus = accountCheck.data.status;
                                    console.log(`Account status from Razorpay: ${liveStatus}`);
                                    if (liveStatus === 'activated') {
                                        wallet.razorpayAccountStatus = 'activated';
                                        console.log(`Account confirmed activated via direct fetch`);
                                    }
                                    else {
                                        wallet.razorpayAccountStatus = 'created';
                                        if (accountCheck.data.requirements) {
                                            console.log('Account Requirements:', JSON.stringify(accountCheck.data.requirements, null, 2));
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            console.error('Step 4 FAILED - Update product config:', updateResult.message);
                        }
                    }
                    yield wallet.save();
                }
            }
            else {
                // Account already active - just update bank details via product config
                if (wallet.razorpayProductId) {
                    const updateResult = yield razorpayRouteService_1.default.updateProductConfiguration(wallet.razorpayLinkedAccountId, wallet.razorpayProductId, {
                        accountNumber,
                        ifscCode,
                        beneficiaryName: accountHolderName,
                    });
                    if (updateResult.success) {
                        console.log('Bank details updated on existing Route account');
                    }
                }
            }
        }
        catch (routeError) {
            console.error('Razorpay Route setup error:', routeError.message);
            // Don't fail the bank details update even if Route setup fails
        }
    }
    // Refresh wallet data
    wallet = (yield wallet_model_1.Wallet.findById(wallet._id));
    let responseMessage = 'Bank details updated successfully';
    if ((wallet === null || wallet === void 0 ? void 0 : wallet.razorpayLinkedAccountId) && (wallet === null || wallet === void 0 ? void 0 : wallet.razorpayAccountStatus) === 'activated') {
        responseMessage = 'Bank details updated and Razorpay Route account configured successfully';
    }
    else if ((wallet === null || wallet === void 0 ? void 0 : wallet.razorpayAccountStatus) === 'failed') {
        responseMessage = 'Bank details saved, but Razorpay Route account setup failed. Please try updating bank details again.';
    }
    else if ((wallet === null || wallet === void 0 ? void 0 : wallet.razorpayAccountStatus) === 'created') {
        responseMessage = 'Bank details updated and Razorpay Route account created (pending activation)';
    }
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: responseMessage,
        data: wallet,
    });
}));
// Delete/Clear Bank Details
const deleteBankDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
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
    // Delete linked account on Razorpay if exists
    if (wallet.razorpayLinkedAccountId) {
        try {
            yield razorpayRouteService_1.default.deleteLinkedAccount(wallet.razorpayLinkedAccountId);
            console.log(`Razorpay linked account ${wallet.razorpayLinkedAccountId} suspended/deleted`);
        }
        catch (err) {
            console.error('Failed to delete Razorpay linked account:', err.message);
        }
    }
    // Clear bank details and Route fields
    wallet.bankDetails = {
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branchName: '',
        upiId: '',
    };
    wallet.razorpayLinkedAccountId = undefined;
    wallet.razorpayAccountStatus = undefined;
    wallet.razorpayProductId = undefined;
    yield wallet.save();
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Bank details deleted successfully',
        data: wallet,
    });
}));
// ==================== WITHDRAWAL CONTROLLERS ====================
// Request Withdrawal - Kept for backward compatibility but Route vendors don't need this
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
    // If vendor has Route linked account, withdrawals are automatic
    if (wallet.razorpayLinkedAccountId) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Your account uses Razorpay Route. Payments are automatically settled to your bank account. No manual withdrawal needed.',
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
    // Create withdrawal request (manual processing by admin for non-Route vendors)
    const withdrawalRequest = yield wallet_model_1.WithdrawalRequest.create({
        walletId: wallet._id,
        userId: user._id,
        amount,
        bankDetails: wallet.bankDetails,
        status: 'pending'
    });
    // Deduct from wallet balance immediately
    wallet.balance -= amount;
    yield wallet.save();
    // Create transaction record
    yield wallet_model_1.WalletTransaction.create({
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
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Withdrawal request submitted. It will be processed by admin.',
        data: withdrawalRequest,
    });
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
// For Route vendors: Records the transaction for tracking (actual payment via Route transfer)
// For non-Route vendors: Adds to pending balance (old flow)
const creditVendorEarnings = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { vendorId, amount, serviceType, referenceType, referenceId, metadata, isGovernmentEvent, razorpayTransferId, razorpayPaymentId } = params;
    // Get platform fee - Government events have fixed 10% fee
    let platformFeePercentage;
    if (serviceType === 'events' && isGovernmentEvent) {
        platformFeePercentage = 10;
    }
    else {
        const feeKey = serviceType === 'events' ? 'event_platform_fee' : 'movie_watch_platform_fee';
        const platformFeeSetting = yield platformSettings_model_1.PlatformSettings.findOne({ key: feeKey });
        platformFeePercentage = (platformFeeSetting === null || platformFeeSetting === void 0 ? void 0 : platformFeeSetting.value) || (serviceType === 'events' ? 20 : 50);
    }
    // Calculate amounts
    const platformFee = (amount * platformFeePercentage) / 100;
    const vendorEarnings = amount - platformFee;
    // Get or create vendor wallet
    const wallet = yield getOrCreateWallet(vendorId, 'vendor');
    const holdDays = razorpayRouteService_1.default.getSettlementHoldDays();
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + holdDays);
    const isRouteVendor = !!wallet.razorpayLinkedAccountId;
    if (isRouteVendor && razorpayTransferId) {
        // Route vendor: Payment is handled by Razorpay Route transfer
        // Track earnings for dashboard but don't add to internal wallet balance
        wallet.totalEarnings += vendorEarnings;
        wallet.pendingBalance += vendorEarnings;
        yield wallet.save();
        // Create transaction record for tracking
        yield wallet_model_1.WalletTransaction.create({
            walletId: wallet._id,
            userId: vendorId,
            type: 'pending_credit',
            amount,
            platformFee,
            netAmount: vendorEarnings,
            description: `${serviceType === 'events' ? (isGovernmentEvent ? 'Government event booking' : 'Event booking') : 'Video purchase'} - Route payment (settles in ${holdDays} days)`,
            referenceType,
            referenceId,
            serviceType,
            status: 'completed',
            availableAt,
            razorpayTransferId,
            razorpayPaymentId,
            metadata: Object.assign(Object.assign({}, metadata), { isGovernmentEvent: isGovernmentEvent || false, platformFeePercentage })
        });
    }
    else {
        // Non-Route vendor: Old flow - add to pending balance for manual withdrawal
        wallet.pendingBalance += vendorEarnings;
        wallet.totalEarnings += vendorEarnings;
        yield wallet.save();
        yield wallet_model_1.WalletTransaction.create({
            walletId: wallet._id,
            userId: vendorId,
            type: 'pending_credit',
            amount,
            platformFee,
            netAmount: vendorEarnings,
            description: `${serviceType === 'events' ? (isGovernmentEvent ? 'Government event booking' : 'Event booking') : 'Video purchase'} earnings (available after ${holdDays} days)`,
            referenceType,
            referenceId,
            serviceType,
            status: 'completed',
            availableAt,
            metadata: Object.assign(Object.assign({}, metadata), { isGovernmentEvent: isGovernmentEvent || false, platformFeePercentage })
        });
    }
    // Create platform fee transaction for admin tracking (always)
    yield wallet_model_1.WalletTransaction.create({
        walletId: wallet._id,
        userId: vendorId,
        type: 'platform_fee',
        amount: platformFee,
        platformFee: 0,
        netAmount: platformFee,
        description: `Platform fee (${platformFeePercentage}%) from ${serviceType === 'events' ? (isGovernmentEvent ? 'government event booking' : 'event booking') : 'video purchase'}`,
        referenceType,
        referenceId,
        serviceType,
        status: 'completed',
        metadata: Object.assign(Object.assign({}, metadata), { isGovernmentEvent: isGovernmentEvent || false, platformFeePercentage })
    });
    return { vendorEarnings, platformFee, platformFeePercentage, availableAt, isRouteVendor };
});
// Get vendor's linked account ID (used by payment controllers)
const getVendorLinkedAccountId = (vendorId) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findOne({ userId: vendorId });
    if (!(wallet === null || wallet === void 0 ? void 0 : wallet.razorpayLinkedAccountId)) {
        return null;
    }
    // If already activated in DB, return immediately
    if (wallet.razorpayAccountStatus === 'activated') {
        return wallet.razorpayLinkedAccountId;
    }
    // Sync live status from Razorpay (account may have been activated since last check)
    try {
        const fetchResult = yield razorpayRouteService_1.default.fetchLinkedAccount(wallet.razorpayLinkedAccountId);
        if (fetchResult.success && fetchResult.data) {
            const liveStatus = fetchResult.data.status;
            // Update status in DB if it changed
            if (liveStatus !== wallet.razorpayAccountStatus) {
                wallet.razorpayAccountStatus = liveStatus;
                yield wallet.save();
                console.log(`Synced Razorpay account status to '${liveStatus}' for vendor ${vendorId}`);
            }
            if (liveStatus === 'activated') {
                return wallet.razorpayLinkedAccountId;
            }
            // FOR TEST MODE: Allow transfers even if not fully activated yet
            // This helps the user see transfers in their dashboard during development
            if (process.env.NODE_ENV !== 'production' && (liveStatus === 'created' || liveStatus === 'needs_clarification')) {
                console.log(`Allowing transfer for vendor ${vendorId} in test mode with status: ${liveStatus}`);
                return wallet.razorpayLinkedAccountId;
            }
            if (liveStatus === 'suspended') {
                return null;
            }
        }
    }
    catch (err) {
        console.error('Failed to sync Razorpay account status:', err.message);
    }
    return null;
});
// Get platform fee percentage for a service
const getPlatformFeePercentage = (serviceType, isGovernmentEvent) => __awaiter(void 0, void 0, void 0, function* () {
    if (serviceType === 'events' && isGovernmentEvent) {
        return 10;
    }
    const feeKey = serviceType === 'events' ? 'event_platform_fee' : 'movie_watch_platform_fee';
    const platformFeeSetting = yield platformSettings_model_1.PlatformSettings.findOne({ key: feeKey });
    return (platformFeeSetting === null || platformFeeSetting === void 0 ? void 0 : platformFeeSetting.value) || (serviceType === 'events' ? 20 : 50);
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
    deleteBankDetails,
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
    handleRefund,
    getVendorLinkedAccountId,
    getPlatformFeePercentage,
};
