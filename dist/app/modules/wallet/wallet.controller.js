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
    var _a, _b, _c, _d, _e, _f;
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
    // Self-correct totalWithdrawn from actual completed withdrawal records
    // This fixes any corruption from past double-counting bugs
    if (wallet.razorpayLinkedAccountId) {
        const actualWithdrawnAgg = yield wallet_model_1.WithdrawalRequest.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(user._id),
                    status: 'completed',
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const actualWithdrawn = ((_a = actualWithdrawnAgg[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        if (wallet.totalWithdrawn !== actualWithdrawn) {
            console.log(`Correcting totalWithdrawn for user ${user._id}: ${wallet.totalWithdrawn} -> ${actualWithdrawn}`);
            wallet.totalWithdrawn = actualWithdrawn;
            yield wallet.save();
        }
    }
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
    // Get pending withdrawals count and amount
    const [pendingWithdrawals, pendingWithdrawalAmountAgg] = yield Promise.all([
        wallet_model_1.WithdrawalRequest.countDocuments({
            userId: user._id,
            status: { $in: ['pending', 'processing'] }
        }),
        wallet_model_1.WithdrawalRequest.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(user._id),
                    status: { $in: ['pending', 'processing'] },
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
    ]);
    const pendingWithdrawalAmount = ((_b = pendingWithdrawalAmountAgg[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Wallet stats retrieved successfully',
        data: {
            wallet,
            earnings: {
                daily: ((_c = dailyEarnings[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
                weekly: ((_d = weeklyEarnings[0]) === null || _d === void 0 ? void 0 : _d.total) || 0,
                monthly: ((_e = monthlyEarnings[0]) === null || _e === void 0 ? void 0 : _e.total) || 0,
                yearly: ((_f = yearlyEarnings[0]) === null || _f === void 0 ? void 0 : _f.total) || 0
            },
            earningsByService: earningsByService.reduce((acc, item) => {
                acc[item._id || 'other'] = { total: item.total, count: item.count };
                return acc;
            }, {}),
            recentTransactions,
            pendingWithdrawals,
            pendingWithdrawalAmount,
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
    var _a, _b, _c, _d, _e;
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
            if (!wallet.razorpayLinkedAccountId || wallet.razorpayAccountStatus === 'failed' || wallet.razorpayAccountStatus === 'created') {
                // ===== RAZORPAY ROUTE SETUP (handles fresh + retry flows) =====
                let accountId = wallet.razorpayLinkedAccountId;
                const vendorName = accountHolderName || user.name || 'Vendor';
                const vendorPhone = user.phone || '9999999999';
                // Step 1: Create Linked Account (skip if already exists)
                if (accountId && wallet.razorpayAccountStatus === 'failed') {
                    // Delete and recreate on hard failure
                    console.log(`Step 1 - Deleting failed linked account: ${accountId}`);
                    yield razorpayRouteService_1.default.deleteLinkedAccount(accountId);
                    accountId = '';
                    wallet.razorpayLinkedAccountId = '';
                    wallet.razorpayProductId = '';
                    yield wallet.save();
                }
                if (!accountId) {
                    const referenceId = razorpayRouteService_1.default.generateVendorReferenceId(user._id.toString());
                    const result = yield razorpayRouteService_1.default.createLinkedAccount({
                        email: user.email,
                        phone: vendorPhone,
                        legalBusinessName: vendorName,
                        contactName: vendorName,
                        businessType: 'individual',
                        referenceId,
                    });
                    if (result.success && result.accountId) {
                        accountId = result.accountId;
                        wallet.razorpayLinkedAccountId = accountId;
                        wallet.razorpayAccountStatus = 'created';
                        yield wallet.save();
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
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                    // Step 2: Create or Update Stakeholder
                    const stakeholdersResult = yield razorpayRouteService_1.default.fetchStakeholders(accountId);
                    const existingStakeholders = ((_a = stakeholdersResult.data) === null || _a === void 0 ? void 0 : _a.items) || [];
                    if (existingStakeholders.length > 0) {
                        // Stakeholder exists - update it (fixes needs_clarification name issues)
                        const stakeholderId = existingStakeholders[0].id;
                        const updateStakeholderResult = yield razorpayRouteService_1.default.updateStakeholder(accountId, stakeholderId, { name: vendorName, email: user.email, phone: vendorPhone });
                        if (updateStakeholderResult.success) {
                            console.log(`Step 2 OK - Stakeholder updated: ${stakeholderId}`);
                        }
                        else {
                            console.log(`Step 2 WARN - Stakeholder update: ${updateStakeholderResult.message}`);
                        }
                    }
                    else {
                        // Create fresh stakeholder
                        const stakeholderResult = yield razorpayRouteService_1.default.createStakeholder(accountId, {
                            name: vendorName,
                            email: user.email,
                            phone: vendorPhone,
                        });
                        if (stakeholderResult.success) {
                            console.log(`Step 2 OK - Stakeholder created`);
                        }
                        else {
                            console.log(`Step 2 WARN - Stakeholder creation: ${stakeholderResult.message} (continuing...)`);
                        }
                    }
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                    // Step 3: Request Product Configuration (skip if already exists)
                    let productId = wallet.razorpayProductId;
                    if (!productId) {
                        const productResult = yield razorpayRouteService_1.default.requestProductConfiguration(accountId);
                        if (productResult.success && ((_b = productResult.data) === null || _b === void 0 ? void 0 : _b.id)) {
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
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                    // Step 4: Update Product Configuration with bank details to trigger activation
                    if (productId) {
                        const updateResult = yield razorpayRouteService_1.default.updateProductConfiguration(accountId, productId, {
                            accountNumber,
                            ifscCode,
                            beneficiaryName: accountHolderName,
                        });
                        if (updateResult.success) {
                            const activationStatus = (_c = updateResult.data) === null || _c === void 0 ? void 0 : _c.activation_status;
                            console.log(`Step 4 OK - Product config updated, activation_status: ${activationStatus}`);
                            if (activationStatus === 'activated') {
                                wallet.razorpayAccountStatus = 'activated';
                                console.log(`Account activated successfully`);
                            }
                            else {
                                if (((_e = (_d = updateResult.data) === null || _d === void 0 ? void 0 : _d.requirements) === null || _e === void 0 ? void 0 : _e.length) > 0) {
                                    console.log('Product Config Requirements:', JSON.stringify(updateResult.data.requirements, null, 2));
                                }
                                // Wait and re-fetch account to confirm status
                                yield new Promise(resolve => setTimeout(resolve, 2000));
                                const accountCheck = yield razorpayRouteService_1.default.fetchLinkedAccount(accountId);
                                if (accountCheck.success && accountCheck.data) {
                                    const liveStatus = accountCheck.data.status;
                                    console.log(`Account status from Razorpay: ${liveStatus}`);
                                    wallet.razorpayAccountStatus = liveStatus === 'activated' ? 'activated' : 'created';
                                    if (liveStatus === 'activated') {
                                        console.log(`Account confirmed activated`);
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
// Request Withdrawal
// For Route vendors: Only event earnings need withdrawal (watch movie auto-settles)
// For non-Route vendors: All earnings need manual withdrawal
const requestWithdrawal = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
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
    const isRouteVendor = !!wallet.razorpayLinkedAccountId;
    // For Route vendors: check available event earnings (from transaction history minus withdrawn & pending)
    // For non-Route vendors: check wallet.balance as usual
    let availableForWithdrawal = wallet.balance;
    if (isRouteVendor) {
        const [eventEarningsAgg, pendingWithdrawalsAgg] = yield Promise.all([
            wallet_model_1.WalletTransaction.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.default.Types.ObjectId(user._id),
                        serviceType: 'events',
                        type: { $in: ['credit', 'pending_credit'] },
                        status: 'completed',
                    }
                },
                { $group: { _id: null, total: { $sum: '$netAmount' } } }
            ]),
            wallet_model_1.WithdrawalRequest.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.default.Types.ObjectId(user._id),
                        status: { $in: ['pending', 'processing'] },
                        isRouteWithdrawal: true,
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
        ]);
        const totalEventEarnings = ((_c = eventEarningsAgg[0]) === null || _c === void 0 ? void 0 : _c.total) || 0;
        const pendingAmount = ((_d = pendingWithdrawalsAgg[0]) === null || _d === void 0 ? void 0 : _d.total) || 0;
        availableForWithdrawal = Math.max(0, totalEventEarnings - wallet.totalWithdrawn - pendingAmount);
    }
    // Check available balance
    if (availableForWithdrawal < amount) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: `Insufficient balance. Available: ₹${availableForWithdrawal.toFixed(2)}`,
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
    // For Route vendors: Find held event transfer IDs to release on admin approval
    let heldTransferIds = [];
    if (isRouteVendor) {
        const heldEventTransactions = yield wallet_model_1.WalletTransaction.find({
            userId: user._id,
            serviceType: 'events',
            status: 'completed',
            razorpayTransferId: { $exists: true, $ne: '' },
            type: { $in: ['pending_credit', 'credit'] },
        }).sort({ createdAt: -1 });
        heldTransferIds = heldEventTransactions
            .filter(t => t.razorpayTransferId)
            .map(t => t.razorpayTransferId);
    }
    // Create withdrawal request
    const withdrawalRequest = yield wallet_model_1.WithdrawalRequest.create({
        walletId: wallet._id,
        userId: user._id,
        amount,
        bankDetails: wallet.bankDetails,
        status: 'pending',
        isRouteWithdrawal: isRouteVendor,
        razorpayTransferIds: heldTransferIds,
    });
    // Non-Route vendors: deduct from wallet balance immediately
    // Route vendors: don't deduct anything here — money is held on Razorpay,
    // totalWithdrawn is updated when admin approves in processWithdrawal
    if (!isRouteVendor) {
        wallet.balance -= amount;
        yield wallet.save();
    }
    // Create transaction record
    yield wallet_model_1.WalletTransaction.create({
        walletId: wallet._id,
        userId: user._id,
        type: 'debit',
        amount,
        platformFee: 0,
        netAmount: amount,
        description: isRouteVendor
            ? `Event earnings withdrawal request #${withdrawalRequest._id} (Route)`
            : `Withdrawal request #${withdrawalRequest._id}`,
        referenceType: 'withdrawal',
        referenceId: withdrawalRequest._id,
        status: 'pending'
    });
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: isRouteVendor
            ? 'Event earnings withdrawal request submitted. Admin will review and release funds to your bank account.'
            : 'Withdrawal request submitted. It will be processed by admin.',
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
// For Route vendors with event earnings: releases held transfers via Razorpay Route
// For non-Route vendors: admin manually processes the payout
const processWithdrawal = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
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
        // For Route vendors: Release held event transfers so Razorpay settles to vendor's bank
        const withdrawalData = withdrawal;
        if (withdrawalData.isRouteWithdrawal) {
            const releaseResults = [];
            // Get transfer IDs: use stored ones if available, otherwise fresh lookup from DB
            let transferIdsToRelease = (withdrawalData.razorpayTransferIds || []).filter((id) => !!id);
            if (transferIdsToRelease.length === 0) {
                // Fallback 1: fresh DB lookup for event transactions with razorpayTransferId
                console.log(`Withdrawal ${withdrawal._id} has empty razorpayTransferIds — doing fresh DB lookup for vendor ${withdrawal.userId}`);
                const freshEventTxns = yield wallet_model_1.WalletTransaction.find({
                    userId: withdrawal.userId,
                    serviceType: 'events',
                    status: 'completed',
                    razorpayTransferId: { $exists: true, $ne: '' },
                    type: { $in: ['pending_credit', 'credit'] },
                });
                transferIdsToRelease = freshEventTxns
                    .filter(t => t.razorpayTransferId)
                    .map(t => t.razorpayTransferId);
                console.log(`DB fallback found ${transferIdsToRelease.length} event transfer IDs: ${transferIdsToRelease.join(', ')}`);
            }
            if (transferIdsToRelease.length === 0) {
                // Fallback 2: fetch ALL on-hold transfers directly from Razorpay by linked account
                const vendorWallet = yield wallet_model_1.Wallet.findById(withdrawal.walletId);
                if (vendorWallet === null || vendorWallet === void 0 ? void 0 : vendorWallet.razorpayLinkedAccountId) {
                    console.log(`DB fallback found nothing — fetching on-hold transfers from Razorpay for account ${vendorWallet.razorpayLinkedAccountId}`);
                    const razorpayResult = yield razorpayRouteService_1.default.fetchTransfersByRecipient(vendorWallet.razorpayLinkedAccountId, 100);
                    if (razorpayResult.success && ((_b = (_a = razorpayResult.data) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                        // Only release transfers that are currently on_hold
                        const onHoldTransfers = razorpayResult.data.items.filter((t) => t.on_hold === true || t.settlement_status === 'on_hold');
                        transferIdsToRelease = onHoldTransfers.map((t) => t.id);
                        console.log(`Razorpay fallback found ${transferIdsToRelease.length} on-hold transfers: ${transferIdsToRelease.join(', ')}`);
                    }
                    else {
                        console.log(`Razorpay fallback: no transfers found. Result: ${razorpayResult.message}`);
                    }
                }
            }
            // Update the withdrawal record with found IDs for future reference
            if (transferIdsToRelease.length > 0) {
                withdrawalData.razorpayTransferIds = transferIdsToRelease;
            }
            console.log(`Processing Route withdrawal ${withdrawal._id}: releasing ${transferIdsToRelease.length} transfers`);
            if (transferIdsToRelease.length === 0) {
                console.warn(`No transfer IDs found for Route withdrawal ${withdrawal._id}. Vendor: ${withdrawal.userId}. No Razorpay holds to release.`);
                withdrawal.adminNotes = (withdrawal.adminNotes ? withdrawal.adminNotes + ' | ' : '') + 'WARNING: No Razorpay transfer IDs found to release. Check vendor event transactions.';
            }
            for (const transferId of transferIdsToRelease) {
                try {
                    console.log(`Releasing hold on transfer ${transferId}...`);
                    const result = yield razorpayRouteService_1.default.modifySettlementHold(transferId, false);
                    releaseResults.push({
                        transferId,
                        success: result.success,
                        message: result.message,
                    });
                    if (result.success) {
                        console.log(`Route transfer ${transferId} hold released. Settlement status: ${(_c = result.data) === null || _c === void 0 ? void 0 : _c.settlement_status}, on_hold: ${(_d = result.data) === null || _d === void 0 ? void 0 : _d.on_hold}`);
                    }
                    else {
                        console.error(`Failed to release Route transfer ${transferId}: ${result.message}`, result.data);
                    }
                }
                catch (err) {
                    console.error(`Error releasing Route transfer ${transferId}:`, err.message);
                    releaseResults.push({
                        transferId,
                        success: false,
                        message: err.message,
                    });
                }
            }
            // Store release results in admin notes for tracking
            if (releaseResults.length > 0) {
                const existingNotes = withdrawal.adminNotes || '';
                const releaseInfo = releaseResults.map(r => `${r.transferId}: ${r.success ? 'Released' : 'Failed - ' + r.message}`).join('; ');
                withdrawal.adminNotes = existingNotes ? `${existingNotes} | Route releases: ${releaseInfo}` : `Route releases: ${releaseInfo}`;
            }
        }
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
        // Refund to wallet (only for non-Route vendors who had balance deducted)
        const withdrawalData = withdrawal;
        if (!withdrawalData.isRouteWithdrawal) {
            const wallet = yield wallet_model_1.Wallet.findById(withdrawal.walletId);
            if (wallet) {
                wallet.balance += withdrawal.amount;
                yield wallet.save();
            }
        }
        // Update transaction status
        yield wallet_model_1.WalletTransaction.findOneAndUpdate({ referenceId: withdrawal._id, referenceType: 'withdrawal' }, { status: 'failed' });
    }
    yield withdrawal.save();
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: status === 'completed'
            ? withdrawal.isRouteWithdrawal
                ? 'Withdrawal approved. Route transfer holds released - funds will settle to vendor\'s bank account.'
                : 'Withdrawal request processed successfully'
            : 'Withdrawal request updated',
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
        if (serviceType === 'movie_watch') {
            // Watch movie: on_hold=false → Razorpay auto-settles to vendor's bank
            // Only track earnings for dashboard, don't add to withdrawable balance
            wallet.totalEarnings += vendorEarnings;
            yield wallet.save();
            yield wallet_model_1.WalletTransaction.create({
                walletId: wallet._id,
                userId: vendorId,
                type: 'credit',
                amount,
                platformFee,
                netAmount: vendorEarnings,
                description: `Video purchase - Route auto-settlement (paid directly to bank)`,
                referenceType,
                referenceId,
                serviceType,
                status: 'completed',
                razorpayTransferId,
                razorpayPaymentId,
                metadata: Object.assign(Object.assign({}, metadata), { isGovernmentEvent: false, platformFeePercentage, routeAutoSettle: true })
            });
        }
        else {
            // Events: on_hold=true → Funds held on Route until admin approves withdrawal
            // Add to wallet balance so vendor can request withdrawal
            wallet.totalEarnings += vendorEarnings;
            wallet.balance += vendorEarnings;
            yield wallet.save();
            yield wallet_model_1.WalletTransaction.create({
                walletId: wallet._id,
                userId: vendorId,
                type: 'credit',
                amount,
                platformFee,
                netAmount: vendorEarnings,
                description: `${isGovernmentEvent ? 'Government event booking' : 'Event booking'} - Route payment (held until withdrawal approved)`,
                referenceType,
                referenceId,
                serviceType,
                status: 'completed',
                razorpayTransferId,
                razorpayPaymentId,
                metadata: Object.assign(Object.assign({}, metadata), { isGovernmentEvent: isGovernmentEvent || false, platformFeePercentage, routeOnHold: true })
            });
        }
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
