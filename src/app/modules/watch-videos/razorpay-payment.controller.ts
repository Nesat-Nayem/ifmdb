import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import {
  WatchVideo,
  VideoPurchase,
  VideoPaymentTransaction,
} from './watch-videos.model';
import { WalletController } from '../wallet/wallet.controller';
import razorpayService from '../../services/razorpayService';

// Generate unique purchase reference
const generatePurchaseReference = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `VPR${timestamp}${randomStr}`.toUpperCase();
};

// Create Razorpay payment order for video purchase
const createVideoPaymentOrder = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const {
    userId,
    purchaseType = 'buy',
    countryCode = 'IN',
    customerDetails,
  } = req.body;

  // Validate video
  const video = await WatchVideo.findById(videoId).populate('channelId');
  if (!video || !video.isActive || video.status !== 'published') {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Video not available for purchase',
      data: null,
    });
  }

  // Check if video is free
  if (video.isFree) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'This video is free to watch',
      data: null,
    });
  }

  // Check if already purchased
  const existingPurchase = await VideoPurchase.findOne({
    userId,
    videoId,
    paymentStatus: 'completed',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });

  if (existingPurchase) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'You have already purchased this video',
      data: null,
    });
  }

  // Get price based on country
  let price = video.defaultPrice;
  let currency = razorpayService.getCurrencyForCountry(countryCode);

  if (countryCode && video.countryPricing && video.countryPricing.length > 0) {
    const countryPrice = (video.countryPricing as any[]).find(
      (cp) => cp.countryCode === countryCode && cp.isActive
    );
    if (countryPrice) {
      price = countryPrice.price as number;
      currency = countryPrice.currency as string;
    }
  }

  // Calculate amounts (no GST for video purchases)
  const totalAmount = price;
  const finalAmount = totalAmount;

  const purchaseReference = generatePurchaseReference();

  // Calculate expiry for rental (7 days)
  let expiresAt = null;
  if (purchaseType === 'rent') {
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  try {
    // Create Razorpay order
    const razorpayOrder = await razorpayService.createOrder({
      amount: finalAmount,
      currency: currency,
      receipt: purchaseReference,
      notes: {
        videoId: videoId,
        userId: userId,
        purchaseType: purchaseType,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
      },
    });

    // Create purchase record with pending status
    const purchaseData = {
      userId: new mongoose.Types.ObjectId(userId),
      videoId: new mongoose.Types.ObjectId(videoId),
      purchaseType,
      amount: totalAmount,
      currency,
      countryCode,
      paymentStatus: 'pending',
      paymentMethod: 'razorpay',
      transactionId: razorpayOrder.id,
      purchaseReference,
      expiresAt,
      customerDetails,
      purchasedAt: new Date(),
    };

    const newPurchase = await VideoPurchase.create(purchaseData);

    // Record initial transaction
    await VideoPaymentTransaction.create({
      purchaseId: newPurchase._id,
      paymentGateway: 'razorpay',
      gatewayTransactionId: razorpayOrder.id,
      amount: finalAmount,
      currency,
      status: 'pending',
      paymentMethod: 'razorpay',
      gatewayResponse: razorpayOrder,
    });

    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Razorpay payment order created successfully',
      data: {
        purchase: newPurchase,
        paymentGateway: 'razorpay',
        razorpayOrder: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: razorpayService.getRazorpayKeyId(),
        },
        video: {
          id: video._id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl
        }
      },
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to create payment order',
      data: error.message || null,
    });
  }
});

// Verify Razorpay payment for video
const verifyVideoPayment = catchAsync(async (req: Request, res: Response) => {
  const { orderId, paymentId, signature } = req.body;

  // Verify signature
  const isValid = razorpayService.verifyPaymentSignature(orderId, paymentId, signature);

  if (!isValid) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid payment signature',
      data: null,
    });
  }

  try {
    // Fetch payment details from Razorpay
    const payment = await razorpayService.fetchPayment(paymentId);

    // Find purchase by transaction ID (order ID)
    const purchase = await VideoPurchase.findOne({ transactionId: orderId });
    if (!purchase) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Purchase not found',
        data: null,
      });
    }

    // Update transaction record
    await VideoPaymentTransaction.findOneAndUpdate(
      { gatewayTransactionId: orderId },
      {
        status: payment.status === 'captured' ? 'completed' : payment.status,
        gatewayResponse: payment,
        processedAt: new Date(),
      }
    );

    if (payment.status === 'captured') {
      // Update purchase to completed
      purchase.paymentStatus = 'completed';
      await purchase.save();

      // Get video details
      const video = await WatchVideo.findById(purchase.videoId)
        .populate('channelId', 'name logoUrl');

      // Credit vendor wallet if video has a vendor
      const videoData = video as any;
      const purchaseData = purchase as any;
      if (videoData && videoData.uploadedBy && videoData.uploadedByType === 'vendor') {
        try {
          await WalletController.creditVendorEarnings({
            vendorId: videoData.uploadedBy.toString(),
            amount: purchaseData.amount as number,
            serviceType: 'movie_watch',
            referenceType: 'video_purchase',
            referenceId: purchaseData._id.toString(),
            metadata: {
              purchaseId: purchaseData._id.toString(),
              customerName: purchaseData.customerDetails?.name || '',
              customerEmail: purchaseData.customerDetails?.email || '',
              itemTitle: videoData.title || '',
            },
          });
        } catch (walletError) {
          console.error('Failed to credit vendor wallet:', walletError);
        }
      }

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment verified successfully. You can now watch the video!',
        data: {
          purchase,
          video,
          paymentStatus: 'completed',
          canWatch: true
        },
      });
    } else {
      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment is being processed',
        data: {
          paymentStatus: payment.status,
        },
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to verify payment',
      data: null,
    });
  }
});

// Razorpay Webhook handler for video payments
const handleVideoPaymentWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  // Verify webhook signature
  const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);

  if (!isValid) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;

    // Find and update purchase
    const purchase = await VideoPurchase.findOne({ transactionId: orderId });
    if (purchase && purchase.paymentStatus !== 'completed') {
      purchase.paymentStatus = 'completed';
      await purchase.save();

      // Update transaction
      await VideoPaymentTransaction.findOneAndUpdate(
        { gatewayTransactionId: orderId },
        {
          status: 'completed',
          gatewayResponse: payment,
          processedAt: new Date(),
        }
      );
    }
  } else if (event === 'payment.failed') {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;

    await VideoPurchase.findOneAndUpdate(
      { transactionId: orderId },
      { paymentStatus: 'failed' }
    );

    await VideoPaymentTransaction.findOneAndUpdate(
      { gatewayTransactionId: orderId },
      {
        status: 'failed',
        gatewayResponse: payment,
        processedAt: new Date(),
      }
    );
  }

  return res.status(200).json({ received: true });
});

// Get payment status
const getVideoPaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const purchase = await VideoPurchase.findOne({ transactionId: orderId })
    .populate('videoId', 'title thumbnailUrl posterUrl duration videoType channelId')
    .populate('userId', 'name email phone');

  if (!purchase) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Purchase not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment status retrieved',
    data: {
      purchase,
      canWatch: purchase.paymentStatus === 'completed',
    },
  });
});

// Initiate refund
const initiateVideoRefund = catchAsync(async (req: Request, res: Response) => {
  const { purchaseId } = req.params;
  const { reason } = req.body;

  const purchase = await VideoPurchase.findById(purchaseId);
  if (!purchase) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Purchase not found',
      data: null,
    });
  }

  if (purchase.paymentStatus !== 'completed') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Cannot refund - payment not completed',
      data: null,
    });
  }

  // Check if refund is within allowed period (24 hours)
  const hoursSincePurchase = (Date.now() - new Date(purchase.purchasedAt as Date).getTime()) / (1000 * 60 * 60);
  if (hoursSincePurchase > 24) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Refund period has expired (24 hours)',
      data: null,
    });
  }

  try {
    // Get the payment ID from transaction
    const transaction = await VideoPaymentTransaction.findOne({ 
      purchaseId: purchase._id,
      status: 'completed'
    });

    if (!transaction || !transaction.gatewayResponse) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Payment transaction not found',
        data: null,
      });
    }

    // Get payment ID from gateway response
    const paymentId = (transaction.gatewayResponse as any).id;

    const refund = await razorpayService.refundPayment(
      paymentId,
      purchase.amount as number,
      { reason: reason || 'Customer requested refund' }
    );

    // Update purchase status
    purchase.paymentStatus = 'refunded';
    await purchase.save();

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Refund initiated successfully',
      data: refund,
    });
  } catch (error: any) {
    console.error('Refund error:', error);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to initiate refund',
      data: error.message || null,
    });
  }
});

// Get all purchases (admin)
const getAllPurchases = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    videoId,
    userId,
    paymentStatus,
    startDate,
    endDate,
    sortBy = 'purchasedAt',
    sortOrder = 'desc'
  } = req.query;

  const query: any = {};

  if (videoId) query.videoId = videoId;
  if (userId) query.userId = userId;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  
  if (startDate || endDate) {
    query.purchasedAt = {};
    if (startDate) query.purchasedAt.$gte = new Date(startDate as string);
    if (endDate) query.purchasedAt.$lte = new Date(endDate as string);
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const skip = (Number(page) - 1) * Number(limit);

  const [purchases, total] = await Promise.all([
    VideoPurchase.find(query)
      .populate('videoId', 'title thumbnailUrl channelId')
      .populate('userId', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit)),
    VideoPurchase.countDocuments(query)
  ]);

  // Calculate total revenue
  const totalRevenue = await VideoPurchase.aggregate([
    { $match: { ...query, paymentStatus: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Purchases retrieved successfully',
    data: purchases,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      totalRevenue: totalRevenue[0]?.total || 0
    }
  });
});

// Get vendor's video purchases (for vendors to see their earnings)
const getVendorPurchases = catchAsync(async (req: Request, res: Response) => {
  const { vendorId } = req.params;
  const { page = 1, limit = 10, startDate, endDate } = req.query;

  // Get all videos by this vendor
  const vendorVideos = await WatchVideo.find({ uploadedBy: vendorId }).select('_id');
  const videoIds = vendorVideos.map(v => v._id);

  const query: any = {
    videoId: { $in: videoIds },
    paymentStatus: 'completed'
  };

  if (startDate || endDate) {
    query.purchasedAt = {};
    if (startDate) query.purchasedAt.$gte = new Date(startDate as string);
    if (endDate) query.purchasedAt.$lte = new Date(endDate as string);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [purchases, total, revenueData] = await Promise.all([
    VideoPurchase.find(query)
      .populate('videoId', 'title thumbnailUrl')
      .populate('userId', 'name email')
      .sort({ purchasedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VideoPurchase.countDocuments(query),
    VideoPurchase.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor purchases retrieved',
    data: purchases,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      totalRevenue: revenueData[0]?.total || 0
    }
  });
});

export const RazorpayVideoPaymentController = {
  createVideoPaymentOrder,
  verifyVideoPayment,
  handleVideoPaymentWebhook,
  getVideoPaymentStatus,
  initiateVideoRefund,
  getAllPurchases,
  getVendorPurchases,
};
