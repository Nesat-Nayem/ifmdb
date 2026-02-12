import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { userInterface } from '../../middlewares/userInterface';
import { Wallet, WalletTransaction, WithdrawalRequest } from './wallet.model';
import { PlatformSettings } from '../vendor/platformSettings.model';
import razorpayRouteService from '../../services/razorpayRouteService';

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

  // Sync Razorpay Route account status if vendor has a linked account but not yet activated in DB
  if (
    wallet.razorpayLinkedAccountId &&
    wallet.razorpayAccountStatus !== 'activated' &&
    wallet.razorpayAccountStatus !== 'suspended' &&
    razorpayRouteService.isRouteConfigured()
  ) {
    try {
      const fetchResult = await razorpayRouteService.fetchLinkedAccount(wallet.razorpayLinkedAccountId);
      if (fetchResult.success && fetchResult.data) {
        const liveStatus = fetchResult.data.status;
        if (liveStatus === 'activated') {
          wallet.razorpayAccountStatus = 'activated';
          await wallet.save();
        } else if (liveStatus === 'suspended') {
          wallet.razorpayAccountStatus = 'suspended';
          await wallet.save();
        }
      }
    } catch (err: any) {
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

// Update Bank Details & Create/Update Razorpay Linked Account for Route
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

  let wallet = await getOrCreateWallet(user._id, user.role as 'vendor' | 'admin');

  // Update bank details
  wallet.bankDetails = {
    accountHolderName,
    accountNumber,
    ifscCode,
    bankName,
    branchName: branchName || '',
    upiId: upiId || ''
  };
  await wallet.save();

  // Create Razorpay Linked Account for Route (only for vendors)
  if (user.role === 'vendor' && razorpayRouteService.isRouteConfigured()) {
    try {
      if (!wallet.razorpayLinkedAccountId || wallet.razorpayAccountStatus === 'failed') {
        // ===== FULL 4-STEP RAZORPAY ROUTE SETUP =====
        let accountId = wallet.razorpayLinkedAccountId; // May already exist from a previous partial attempt

        // Step 1: Create Linked Account
        // If retrying with a stale account, delete it first
        if (accountId && wallet.razorpayAccountStatus === 'failed') {
          console.log(`Step 1 - Deleting stale linked account: ${accountId}`);
          await razorpayRouteService.deleteLinkedAccount(accountId);
          accountId = null as any;
          wallet.razorpayLinkedAccountId = '';
          wallet.razorpayProductId = '';
          await wallet.save();
        }

        if (!accountId) {
          const referenceId = razorpayRouteService.generateVendorReferenceId(
            (user._id as mongoose.Types.ObjectId).toString()
          );

          const result = await razorpayRouteService.createLinkedAccount({
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
          } else {
            console.error('Step 1 FAILED - Create linked account:', result.message);
            wallet.razorpayAccountStatus = 'failed';
            await wallet.save();
          }
        } else {
          console.log(`Step 1 SKIP - Linked Account already exists: ${accountId}`);
        }

        if (accountId) {
          wallet.razorpayLinkedAccountId = accountId;
          wallet.razorpayAccountStatus = 'created';
          await wallet.save();

          // Small delay to let Razorpay process the account creation
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Step 2: Create Stakeholder
          // Use the SAME name as legalBusinessName for proprietorship consistency
          const vendorName = accountHolderName || user.name || 'Vendor';
          const stakeholderResult = await razorpayRouteService.createStakeholder(accountId, {
            name: vendorName,
            email: user.email,
            phone: user.phone || '9999999999',
          });

          if (stakeholderResult.success) {
            console.log(`Step 2 OK - Stakeholder created for account: ${accountId}`);
          } else {
            // Stakeholder might already exist from previous attempt - continue anyway
            console.log(`Step 2 WARN - Stakeholder creation: ${stakeholderResult.message} (continuing...)`);
          }

          // Small delay before product configuration
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Step 3: Request Product Configuration
          let productId = wallet.razorpayProductId;
          if (!productId) {
            const productResult = await razorpayRouteService.requestProductConfiguration(accountId);

            if (productResult.success && productResult.data?.id) {
              productId = productResult.data.id;
              wallet.razorpayProductId = productId;
              await wallet.save();
              console.log(`Step 3 OK - Product config requested: ${productId}`);
            } else {
              console.error('Step 3 FAILED - Product config:', productResult.message);
            }
          } else {
            console.log(`Step 3 SKIP - Product config already exists: ${productId}`);
          }

          // Small delay before updating product with bank details
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Step 4: Update Product Configuration with bank details
          if (productId) {
            const updateResult = await razorpayRouteService.updateProductConfiguration(
              accountId,
              productId,
              {
                accountNumber,
                ifscCode,
                beneficiaryName: accountHolderName,
              }
            );

            if (updateResult.success) {
              const activationStatus = updateResult.data?.activation_status;
              console.log(`Step 4 OK - Product config updated, activation_status: ${activationStatus}`);
              
              if (activationStatus !== 'activated') {
                console.log('Product Config Requirements:', JSON.stringify(updateResult.data?.requirements, null, 2));
                
                // Step 5: Explicitly submit the account for activation
                console.log(`Step 5 - Submitting account ${accountId} for activation...`);
                const submitResult = await razorpayRouteService.submitAccount(accountId);
                if (submitResult.success) {
                  console.log('Step 5 OK - Account submitted for activation');
                } else {
                  console.log('Step 5 WARN - Account submission:', submitResult.message);
                }
              }

              if (activationStatus === 'activated') {
                wallet.razorpayAccountStatus = 'activated';
              } else {
                // Fetch actual account status from Razorpay
                const accountCheck = await razorpayRouteService.fetchLinkedAccount(accountId);
                if (accountCheck.success && accountCheck.data) {
                  const liveStatus = accountCheck.data.status;
                  console.log(`Account status from Razorpay: ${liveStatus}`);
                  
                  if (liveStatus === 'activated') {
                    wallet.razorpayAccountStatus = 'activated';
                    console.log(`Account confirmed activated via direct fetch`);
                  } else {
                    wallet.razorpayAccountStatus = 'created';
                    if (accountCheck.data.requirements) {
                      console.log('Account Requirements:', JSON.stringify(accountCheck.data.requirements, null, 2));
                    }
                  }
                }
              }
            } else {
              console.error('Step 4 FAILED - Update product config:', updateResult.message);
            }
          }

          await wallet.save();
        }
      } else {
        // Account already active - just update bank details via product config
        if (wallet.razorpayProductId) {
          const updateResult = await razorpayRouteService.updateProductConfiguration(
            wallet.razorpayLinkedAccountId,
            wallet.razorpayProductId,
            {
              accountNumber,
              ifscCode,
              beneficiaryName: accountHolderName,
            }
          );
          if (updateResult.success) {
            console.log('Bank details updated on existing Route account');
          }
        }
      }
    } catch (routeError: any) {
      console.error('Razorpay Route setup error:', routeError.message);
      // Don't fail the bank details update even if Route setup fails
    }
  }

  // Refresh wallet data
  wallet = await Wallet.findById(wallet._id) as any;

  let responseMessage = 'Bank details updated successfully';
  if (wallet?.razorpayLinkedAccountId && wallet?.razorpayAccountStatus === 'activated') {
    responseMessage = 'Bank details updated and Razorpay Route account configured successfully';
  } else if (wallet?.razorpayAccountStatus === 'failed') {
    responseMessage = 'Bank details saved, but Razorpay Route account setup failed. Please try updating bank details again.';
  } else if (wallet?.razorpayAccountStatus === 'created') {
    responseMessage = 'Bank details updated and Razorpay Route account created (pending activation)';
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: responseMessage,
    data: wallet,
  });
});

// Delete/Clear Bank Details
const deleteBankDetails = catchAsync(async (req: Request, res: Response) => {
  const user = (req as userInterface).user;

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

  // Delete linked account on Razorpay if exists
  if (wallet.razorpayLinkedAccountId) {
    try {
      await razorpayRouteService.deleteLinkedAccount(wallet.razorpayLinkedAccountId);
      console.log(`Razorpay linked account ${wallet.razorpayLinkedAccountId} suspended/deleted`);
    } catch (err: any) {
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
  } as any;
  wallet.razorpayLinkedAccountId = undefined as any;
  wallet.razorpayAccountStatus = undefined as any;
  wallet.razorpayProductId = undefined as any;
  await wallet.save();

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bank details deleted successfully',
    data: wallet,
  });
});

// ==================== WITHDRAWAL CONTROLLERS ====================

// Request Withdrawal - Kept for backward compatibility but Route vendors don't need this
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

  // If vendor has Route linked account, withdrawals are automatic
  if (wallet.razorpayLinkedAccountId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Your account uses Razorpay Route. Payments are automatically settled to your bank account. No manual withdrawal needed.',
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

  // Create withdrawal request (manual processing by admin for non-Route vendors)
  const withdrawalRequest = await WithdrawalRequest.create({
    walletId: wallet._id,
    userId: user._id,
    amount,
    bankDetails: wallet.bankDetails,
    status: 'pending'
  });

  // Deduct from wallet balance immediately
  wallet.balance -= amount;
  await wallet.save();

  // Create transaction record
  await WalletTransaction.create({
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

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Withdrawal request submitted. It will be processed by admin.',
    data: withdrawalRequest,
  });
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
// For Route vendors: Records the transaction for tracking (actual payment via Route transfer)
// For non-Route vendors: Adds to pending balance (old flow)
const creditVendorEarnings = async (params: {
  vendorId: string;
  amount: number;
  serviceType: 'events' | 'movie_watch';
  referenceType: 'event_booking' | 'video_purchase';
  referenceId: string;
  metadata?: any;
  isGovernmentEvent?: boolean;
  razorpayTransferId?: string;
  razorpayPaymentId?: string;
}) => {
  const { vendorId, amount, serviceType, referenceType, referenceId, metadata, isGovernmentEvent, razorpayTransferId, razorpayPaymentId } = params;

  // Get platform fee - Government events have fixed 10% fee
  let platformFeePercentage: number;
  
  if (serviceType === 'events' && isGovernmentEvent) {
    platformFeePercentage = 10;
  } else {
    const feeKey = serviceType === 'events' ? 'event_platform_fee' : 'movie_watch_platform_fee';
    const platformFeeSetting = await PlatformSettings.findOne({ key: feeKey });
    platformFeePercentage = platformFeeSetting?.value || (serviceType === 'events' ? 20 : 50);
  }

  // Calculate amounts
  const platformFee = (amount * platformFeePercentage) / 100;
  const vendorEarnings = amount - platformFee;

  // Get or create vendor wallet
  const wallet = await getOrCreateWallet(vendorId, 'vendor');

  const holdDays = razorpayRouteService.getSettlementHoldDays();
  const availableAt = new Date();
  availableAt.setDate(availableAt.getDate() + holdDays);

  const isRouteVendor = !!wallet.razorpayLinkedAccountId;

  if (isRouteVendor && razorpayTransferId) {
    // Route vendor: Payment is handled by Razorpay Route transfer
    // Track earnings for dashboard but don't add to internal wallet balance
    wallet.totalEarnings += vendorEarnings;
    wallet.pendingBalance += vendorEarnings;
    await wallet.save();

    // Create transaction record for tracking
    await WalletTransaction.create({
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
      metadata: {
        ...metadata,
        isGovernmentEvent: isGovernmentEvent || false,
        platformFeePercentage,
      }
    });
  } else {
    // Non-Route vendor: Old flow - add to pending balance for manual withdrawal
    wallet.pendingBalance += vendorEarnings;
    wallet.totalEarnings += vendorEarnings;
    await wallet.save();

    await WalletTransaction.create({
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
      metadata: {
        ...metadata,
        isGovernmentEvent: isGovernmentEvent || false,
        platformFeePercentage,
      }
    });
  }

  // Create platform fee transaction for admin tracking (always)
  await WalletTransaction.create({
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
    metadata: {
      ...metadata,
      isGovernmentEvent: isGovernmentEvent || false,
      platformFeePercentage,
    }
  });

  return { vendorEarnings, platformFee, platformFeePercentage, availableAt, isRouteVendor };
};

// Get vendor's linked account ID (used by payment controllers)
const getVendorLinkedAccountId = async (vendorId: string): Promise<string | null> => {
  const wallet = await Wallet.findOne({ userId: vendorId });
  if (!wallet?.razorpayLinkedAccountId) {
    return null;
  }

  // If already activated in DB, return immediately
  if (wallet.razorpayAccountStatus === 'activated') {
    return wallet.razorpayLinkedAccountId;
  }

  // Sync live status from Razorpay (account may have been activated since last check)
  try {
    const fetchResult = await razorpayRouteService.fetchLinkedAccount(wallet.razorpayLinkedAccountId);
    if (fetchResult.success && fetchResult.data) {
      const liveStatus = fetchResult.data.status;
      
      // Update status in DB if it changed
      if (liveStatus !== wallet.razorpayAccountStatus) {
        wallet.razorpayAccountStatus = liveStatus as any;
        await wallet.save();
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
  } catch (err: any) {
    console.error('Failed to sync Razorpay account status:', err.message);
  }

  return null;
};

// Get platform fee percentage for a service
const getPlatformFeePercentage = async (serviceType: 'events' | 'movie_watch', isGovernmentEvent?: boolean): Promise<number> => {
  if (serviceType === 'events' && isGovernmentEvent) {
    return 10;
  }
  const feeKey = serviceType === 'events' ? 'event_platform_fee' : 'movie_watch_platform_fee';
  const platformFeeSetting = await PlatformSettings.findOne({ key: feeKey });
  return platformFeeSetting?.value || (serviceType === 'events' ? 20 : 50);
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
