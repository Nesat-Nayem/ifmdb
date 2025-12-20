import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { userInterface } from '../../middlewares/userInterface';
import { Wallet, WalletTransaction, WithdrawalRequest } from './wallet.model';
import { PlatformSettings } from '../vendor/platformSettings.model';
import cashfreePayoutService from '../../services/cashfreePayoutService';

// ==================== WALLET CONTROLLERS ====================

// Get or Create Wallet for User
const getOrCreateWallet = async (userId: string, userType: 'vendor' | 'admin') => {
  let wallet = await Wallet.findOne({ userId });
  
  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      userType,
      balance: 0,
      pendingBalance: 0,
      totalEarnings: 0,
      totalWithdrawn: 0
    });
  }
  
  return wallet;
};

// Get My Wallet
const getMyWallet = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  
  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const wallet = await getOrCreateWallet(user._id, user.role as 'vendor' | 'admin');

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Wallet retrieved successfully',
    data: wallet,
  });
});

// Get Wallet Dashboard Stats (Daily, Weekly, Monthly, Yearly)
const getWalletStats = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  
  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const wallet = await getOrCreateWallet(user._id, user.role as 'vendor' | 'admin');
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Get earnings for different periods
  const [dailyEarnings, weeklyEarnings, monthlyEarnings, yearlyEarnings] = await Promise.all([
    WalletTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user._id),
          type: { $in: ['credit', 'pending_credit', 'pending_to_available'] },
          status: 'completed',
          createdAt: { $gte: startOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ]),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user._id),
          type: { $in: ['credit', 'pending_credit', 'pending_to_available'] },
          status: 'completed',
          createdAt: { $gte: startOfWeek }
        }
      },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ]),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user._id),
          type: { $in: ['credit', 'pending_credit', 'pending_to_available'] },
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ]),
    WalletTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user._id),
          type: { $in: ['credit', 'pending_credit', 'pending_to_available'] },
          status: 'completed',
          createdAt: { $gte: startOfYear }
        }
      },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ])
  ]);

  // Get earnings by service type
  const earningsByService = await WalletTransaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(user._id),
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
  const recentTransactions = await WalletTransaction.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(10);

  // Get pending withdrawals count
  const pendingWithdrawals = await WithdrawalRequest.countDocuments({
    userId: user._id,
    status: 'pending'
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Wallet stats retrieved successfully',
    data: {
      wallet,
      earnings: {
        daily: dailyEarnings[0]?.total || 0,
        weekly: weeklyEarnings[0]?.total || 0,
        monthly: monthlyEarnings[0]?.total || 0,
        yearly: yearlyEarnings[0]?.total || 0
      },
      earningsByService: earningsByService.reduce((acc: any, item: any) => {
        acc[item._id || 'other'] = { total: item.total, count: item.count };
        return acc;
      }, {}),
      recentTransactions,
      pendingWithdrawals
    },
  });
});

// Get Wallet Transactions with Pagination
const getWalletTransactions = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const {
    page = 1,
    limit = 20,
    type,
    status,
    serviceType,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const query: any = { userId: user._id };
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (serviceType) query.serviceType = serviceType;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate as string);
    if (endDate) query.createdAt.$lte = new Date(endDate as string);
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (Number(page) - 1) * Number(limit);

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit)),
    WalletTransaction.countDocuments(query)
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

// Update Bank Details
const updateBankDetails = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId } = req.body;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const wallet = await Wallet.findOneAndUpdate(
    { userId: user._id },
    {
      bankDetails: {
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        branchName: branchName || '',
        upiId: upiId || ''
      }
    },
    { new: true }
  );

  if (!wallet) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Wallet not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bank details updated successfully',
    data: wallet,
  });
});

// ==================== WITHDRAWAL CONTROLLERS ====================

// Request Withdrawal
const requestWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { amount } = req.body;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const wallet = await Wallet.findOne({ userId: user._id });
  
  if (!wallet) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Wallet not found',
      data: null,
    });
  }

  // Check if bank details are complete
  if (!wallet.bankDetails?.accountNumber || !wallet.bankDetails?.ifscCode) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Please add your bank details before requesting withdrawal',
      data: null,
    });
  }

  // Check available balance
  if (wallet.balance < amount) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: `Insufficient balance. Available: ₹${wallet.balance.toFixed(2)}`,
      data: null,
    });
  }

  // Minimum withdrawal check
  if (amount < 100) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Minimum withdrawal amount is ₹100',
      data: null,
    });
  }

  // Check for pending withdrawals
  const pendingWithdrawal = await WithdrawalRequest.findOne({
    userId: user._id,
    status: { $in: ['pending', 'processing'] }
  });

  if (pendingWithdrawal) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'You already have a pending withdrawal request',
      data: null,
    });
  }

  // Create withdrawal request
  const withdrawalRequest = await WithdrawalRequest.create({
    walletId: wallet._id,
    userId: user._id,
    amount,
    bankDetails: wallet.bankDetails,
    status: 'processing' // Changed from 'pending' to 'processing'
  });

  // Deduct from wallet balance immediately
  wallet.balance -= amount;
  await wallet.save();

  // Create transaction record
  const transaction = await WalletTransaction.create({
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

  // ✅ AUTOMATIC CASHFREE PAYOUT - Process withdrawal immediately
  try {
    if (!cashfreePayoutService.isPayoutsConfigured()) {
      throw new Error('Cashfree Payouts not configured. Please contact admin.');
    }

    const payoutResult = await cashfreePayoutService.processWithdrawal(
      (withdrawalRequest._id as mongoose.Types.ObjectId).toString(),
      (user._id as mongoose.Types.ObjectId).toString(),
      amount,
      {
        accountHolderName: wallet.bankDetails.accountHolderName,
        accountNumber: wallet.bankDetails.accountNumber,
        ifscCode: wallet.bankDetails.ifscCode,
        bankName: wallet.bankDetails.bankName,
      },
      user.email,
      user.phone || '0000000000'
    );

    if (payoutResult.success) {
      // Update withdrawal request with Cashfree details
      withdrawalRequest.gatewayTransactionId = payoutResult.transferId;
      withdrawalRequest.gatewayResponse = payoutResult.gatewayResponse;
      withdrawalRequest.status = 'processing'; // Will be updated to 'completed' via webhook
      await withdrawalRequest.save();

      return sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Withdrawal initiated successfully. Funds will be transferred to your bank within 24 hours.',
        data: {
          ...withdrawalRequest.toObject(),
          transferId: payoutResult.transferId,
          estimatedTime: '24 hours'
        },
      });
    } else {
      // Payout failed - refund to wallet
      withdrawalRequest.status = 'failed';
      withdrawalRequest.failureReason = payoutResult.message;
      withdrawalRequest.gatewayResponse = payoutResult.gatewayResponse;
      await withdrawalRequest.save();

      // Refund amount back to wallet
      wallet.balance += amount;
      await wallet.save();

      // Update transaction status
      transaction.status = 'failed';
      await transaction.save();

      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: `Withdrawal failed: ${payoutResult.message}`,
        data: null,
      });
    }
  } catch (error: any) {
    console.error('Cashfree Payout Error:', error);

    // Payout failed - refund to wallet
    withdrawalRequest.status = 'failed';
    withdrawalRequest.failureReason = error.message || 'Payout service error';
    await withdrawalRequest.save();

    // Refund amount back to wallet
    wallet.balance += amount;
    await wallet.save();

    // Update transaction status
    transaction.status = 'failed';
    await transaction.save();

    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || 'Failed to process withdrawal. Amount has been refunded to your wallet.',
      data: null,
    });
  }
});

// Get My Withdrawal History
const getMyWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { page = 1, limit = 20, status } = req.query;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const query: any = { userId: user._id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [withdrawals, total] = await Promise.all([
    WithdrawalRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    WithdrawalRequest.countDocuments(query)
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

// Cancel Withdrawal Request
const cancelWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;
  const { id } = req.params;

  if (!user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const withdrawal = await WithdrawalRequest.findOne({
    _id: id,
    userId: user._id,
    status: 'pending'
  });

  if (!withdrawal) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Withdrawal request not found or cannot be cancelled',
      data: null,
    });
  }

  // Refund to wallet
  const wallet = await Wallet.findById(withdrawal.walletId);
  if (wallet) {
    wallet.balance += withdrawal.amount;
    await wallet.save();
  }

  // Update withdrawal status
  withdrawal.status = 'cancelled';
  await withdrawal.save();

  // Update transaction
  await WalletTransaction.findOneAndUpdate(
    { referenceId: withdrawal._id, referenceType: 'withdrawal' },
    { status: 'cancelled' }
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Withdrawal request cancelled successfully',
    data: withdrawal,
  });
});

// ==================== ADMIN CONTROLLERS ====================

// Get All Wallets (Admin)
const getAllWallets = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, userType, search } = req.query;

  const query: any = {};
  if (userType) query.userType = userType;

  const skip = (Number(page) - 1) * Number(limit);

  const [wallets, total] = await Promise.all([
    Wallet.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Wallet.countDocuments(query)
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

// Get All Withdrawal Requests (Admin)
const getAllWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status } = req.query;

  const query: any = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [withdrawals, total] = await Promise.all([
    WithdrawalRequest.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    WithdrawalRequest.countDocuments(query)
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

// Process Withdrawal (Admin)
const processWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, gatewayTransactionId, adminNotes, failureReason } = req.body;

  const withdrawal = await WithdrawalRequest.findById(id);

  if (!withdrawal) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Withdrawal request not found',
      data: null,
    });
  }

  if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Withdrawal request cannot be processed',
      data: null,
    });
  }

  withdrawal.status = status;
  if (gatewayTransactionId) withdrawal.gatewayTransactionId = gatewayTransactionId;
  if (adminNotes) withdrawal.adminNotes = adminNotes;
  if (failureReason) withdrawal.failureReason = failureReason;
  
  if (status === 'completed') {
    withdrawal.processedAt = new Date();
    
    // Update wallet total withdrawn
    const wallet = await Wallet.findById(withdrawal.walletId);
    if (wallet) {
      wallet.totalWithdrawn += withdrawal.amount;
      await wallet.save();
    }

    // Update transaction status
    await WalletTransaction.findOneAndUpdate(
      { referenceId: withdrawal._id, referenceType: 'withdrawal' },
      { status: 'completed' }
    );
  } else if (status === 'failed') {
    // Refund to wallet
    const wallet = await Wallet.findById(withdrawal.walletId);
    if (wallet) {
      wallet.balance += withdrawal.amount;
      await wallet.save();
    }

    // Update transaction status
    await WalletTransaction.findOneAndUpdate(
      { referenceId: withdrawal._id, referenceType: 'withdrawal' },
      { status: 'failed' }
    );
  }

  await withdrawal.save();

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Withdrawal request processed successfully',
    data: withdrawal,
  });
});

// Get Admin Wallet Stats
const getAdminWalletStats = catchAsync(async (req: Request, res: Response) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get platform earnings (admin's share from platform fees)
  const [
    totalPlatformEarnings,
    dailyPlatformEarnings,
    monthlyPlatformEarnings,
    totalVendorPayouts,
    pendingWithdrawals,
    totalVendors
  ] = await Promise.all([
    WalletTransaction.aggregate([
      {
        $match: {
          type: 'platform_fee',
          status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    WalletTransaction.aggregate([
      {
        $match: {
          type: 'platform_fee',
          status: 'completed',
          createdAt: { $gte: startOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    WalletTransaction.aggregate([
      {
        $match: {
          type: 'platform_fee',
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    WithdrawalRequest.aggregate([
      {
        $match: { status: 'completed' }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    WithdrawalRequest.countDocuments({ status: 'pending' }),
    Wallet.countDocuments({ userType: 'vendor' })
  ]);

  // Platform fee breakdown by service
  const platformFeeByService = await WalletTransaction.aggregate([
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

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin wallet stats retrieved successfully',
    data: {
      totalPlatformEarnings: totalPlatformEarnings[0]?.total || 0,
      dailyPlatformEarnings: dailyPlatformEarnings[0]?.total || 0,
      monthlyPlatformEarnings: monthlyPlatformEarnings[0]?.total || 0,
      totalVendorPayouts: totalVendorPayouts[0]?.total || 0,
      pendingWithdrawals,
      totalVendors,
      platformFeeByService: platformFeeByService.reduce((acc: any, item: any) => {
        acc[item._id || 'other'] = { total: item.total, count: item.count };
        return acc;
      }, {})
    },
  });
});

// ==================== EARNING CREDIT HELPER ====================

// Credit earnings to vendor wallet (called after successful payment)
const creditVendorEarnings = async (params: {
  vendorId: string;
  amount: number;
  serviceType: 'events' | 'movie_watch';
  referenceType: 'event_booking' | 'video_purchase';
  referenceId: string;
  metadata?: any;
}) => {
  const { vendorId, amount, serviceType, referenceType, referenceId, metadata } = params;

  // Get platform fee settings
  const feeKey = serviceType === 'events' ? 'event_platform_fee' : 'movie_watch_platform_fee';
  const platformFeeSetting = await PlatformSettings.findOne({ key: feeKey });
  const platformFeePercentage = platformFeeSetting?.value || (serviceType === 'events' ? 20 : 50);

  // Calculate amounts
  const platformFee = (amount * platformFeePercentage) / 100;
  const vendorEarnings = amount - platformFee;

  // Get or create vendor wallet
  const wallet = await getOrCreateWallet(vendorId, 'vendor');

  // Calculate available date (7 days from now)
  const availableAt = new Date();
  availableAt.setDate(availableAt.getDate() + 7);

  // Add to pending balance
  wallet.pendingBalance += vendorEarnings;
  wallet.totalEarnings += vendorEarnings;
  await wallet.save();

  // Create pending transaction for vendor
  await WalletTransaction.create({
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
  await WalletTransaction.create({
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
};

// Move pending funds to available balance (called by cron job)
const processPendingFunds = async () => {
  const now = new Date();

  // Find all pending transactions that are now available
  const pendingTransactions = await WalletTransaction.find({
    type: 'pending_credit',
    status: 'completed',
    availableAt: { $lte: now }
  });

  for (const transaction of pendingTransactions) {
    const wallet = await Wallet.findById(transaction.walletId);
    if (wallet) {
      // Move from pending to available
      wallet.pendingBalance -= transaction.netAmount;
      wallet.balance += transaction.netAmount;
      await wallet.save();

      // Create a record of the transfer
      await WalletTransaction.create({
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
      await transaction.save();
    }
  }

  return pendingTransactions.length;
};

// Handle refund - deduct from vendor wallet
const handleRefund = async (params: {
  vendorId: string;
  amount: number;
  serviceType: 'events' | 'movie_watch';
  referenceType: 'event_booking' | 'video_purchase';
  referenceId: string;
  metadata?: any;
}) => {
  const { vendorId, amount, serviceType, referenceType, referenceId, metadata } = params;

  const wallet = await Wallet.findOne({ userId: vendorId });
  if (!wallet) return null;

  // Get platform fee settings
  const feeKey = serviceType === 'events' ? 'event_platform_fee' : 'movie_watch_platform_fee';
  const platformFeeSetting = await PlatformSettings.findOne({ key: feeKey });
  const platformFeePercentage = platformFeeSetting?.value || (serviceType === 'events' ? 20 : 50);

  // Calculate vendor's share that was credited
  const platformFee = (amount * platformFeePercentage) / 100;
  const vendorShare = amount - platformFee;

  // First try to deduct from pending balance
  if (wallet.pendingBalance >= vendorShare) {
    wallet.pendingBalance -= vendorShare;
  } else {
    // Deduct remaining from available balance
    const remainingToDeduct = vendorShare - wallet.pendingBalance;
    wallet.pendingBalance = 0;
    wallet.balance = Math.max(0, wallet.balance - remainingToDeduct);
  }
  
  wallet.totalEarnings -= vendorShare;
  await wallet.save();

  // Create refund transaction
  await WalletTransaction.create({
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
};

export const WalletController = {
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
