import { Request, Response } from 'express';
import httpStatus from 'http-status';
import axios from 'axios';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import {
  WatchVideo,
  VideoPurchase,
  VideoPaymentTransaction,
  Channel
} from './watch-videos.model';
import { WalletController } from '../wallet/wallet.controller';
import ccavenueService from '../../services/ccavenueService';

// Cashfree API Configuration
const CASHFREE_API_URL = process.env.CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// Generate unique purchase reference
const generatePurchaseReference = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `VPR${timestamp}${randomStr}`.toUpperCase();
};

// Generate unique order ID for Cashfree
const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `VORD${timestamp}${randomStr}`.toUpperCase();
};

// Create Cashfree payment order for video purchase
const createVideoPaymentOrder = catchAsync(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const {
    userId,
    purchaseType = 'buy',
    countryCode = 'IN',
    customerDetails,
    returnUrl
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
  let currency = 'INR';

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
  
  // Check if user is from India (use Cashfree) or international (use CCAvenue)
  const isIndianUser = countryCode.toUpperCase() === 'IN';

  const purchaseReference = generatePurchaseReference();
  const orderId = generateOrderId();

  // Calculate expiry for rental (7 days)
  let expiresAt = null;
  if (purchaseType === 'rent') {
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  try {
    // Route to appropriate payment gateway based on country
    if (!isIndianUser) {
      // Use CCAvenue for international users
      const ccOrderId = ccavenueService.generateCCOrderId();
      
      const ccOrderParams = {
        orderId: ccOrderId,
        amount: finalAmount,
        currency: currency,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone || '0000000000',
        billingCountry: countryCode,
        redirectUrl: `${process.env.FRONTEND_URL}/payment/ccavenue/callback`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/ccavenue/cancel`,
        merchantParam1: userId,
        merchantParam2: videoId,
        merchantParam3: 'video',
        merchantParam4: purchaseType,
        merchantParam5: purchaseReference,
      };

      const ccavenueData = ccavenueService.createEncryptedRequest(ccOrderParams);

      // Create purchase record with pending status
      const purchaseData = {
        userId: new mongoose.Types.ObjectId(userId),
        videoId: new mongoose.Types.ObjectId(videoId),
        purchaseType,
        amount: totalAmount,
        currency,
        countryCode,
        paymentStatus: 'pending',
        paymentMethod: 'ccavenue',
        transactionId: ccOrderId,
        purchaseReference,
        expiresAt,
        customerDetails,
        purchasedAt: new Date(),
      };

      const newPurchase = await VideoPurchase.create(purchaseData);

      // Record initial transaction
      await VideoPaymentTransaction.create({
        purchaseId: newPurchase._id,
        paymentGateway: 'ccavenue',
        gatewayTransactionId: ccOrderId,
        amount: finalAmount,
        currency,
        status: 'pending',
        paymentMethod: 'ccavenue',
        gatewayResponse: { orderId: ccOrderId },
      });

      return sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'CCAvenue payment order created successfully',
        data: {
          purchase: newPurchase,
          paymentGateway: 'ccavenue',
          ccavenueOrder: {
            orderId: ccOrderId,
            encRequest: ccavenueData.encRequest,
            accessCode: ccavenueData.accessCode,
            ccavenueUrl: ccavenueData.ccavenueUrl,
          },
          video: {
            id: video._id,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl
          }
        },
      });
    }

    // Use Cashfree for Indian users
    // Create Cashfree order
    const cashfreeResponse = await axios.post(
      `${CASHFREE_API_URL}/orders`,
      {
        order_id: orderId,
        order_amount: finalAmount,
        order_currency: currency,
        customer_details: {
          customer_id: userId,
          customer_name: customerDetails.name,
          customer_email: customerDetails.email,
          customer_phone: customerDetails.phone,
        },
        order_meta: {
          return_url: returnUrl || `${process.env.FRONTEND_URL}/watch-movie-deatils?id=${videoId}&order_id={order_id}`,
          notify_url: `${process.env.BACKEND_URL}/v1/api/watch-videos/payment/webhook`,
        },
        order_note: `Video: ${video.title} | Type: ${purchaseType}`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
        },
      }
    );

    const cashfreeOrder = cashfreeResponse.data;

    // Create purchase record with pending status
    const purchaseData = {
      userId: new mongoose.Types.ObjectId(userId),
      videoId: new mongoose.Types.ObjectId(videoId),
      purchaseType,
      amount: totalAmount,
      currency,
      countryCode,
      paymentStatus: 'pending',
      paymentMethod: 'cashfree',
      transactionId: orderId,
      purchaseReference,
      expiresAt,
      customerDetails,
      purchasedAt: new Date(),
    };

    const newPurchase = await VideoPurchase.create(purchaseData);

    // Record initial transaction
    await VideoPaymentTransaction.create({
      purchaseId: newPurchase._id,
      paymentGateway: 'cashfree',
      gatewayTransactionId: orderId,
      amount: finalAmount,
      currency,
      status: 'pending',
      paymentMethod: 'cashfree',
      gatewayResponse: cashfreeOrder,
    });

    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Payment order created successfully',
      data: {
        purchase: newPurchase,
        cashfreeOrder: {
          orderId: cashfreeOrder.order_id,
          orderToken: cashfreeOrder.order_token,
          paymentSessionId: cashfreeOrder.payment_session_id,
          orderStatus: cashfreeOrder.order_status,
          cfOrderId: cashfreeOrder.cf_order_id,
        },
        paymentLink: cashfreeOrder.payment_link,
        video: {
          id: video._id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl
        }
      },
    });
  } catch (error: any) {
    console.error('Cashfree order creation error:', error.response?.data || error.message);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to create payment order',
      data: error.response?.data || null,
    });
  }
});

// Verify Cashfree payment for video
const verifyVideoPayment = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    // Fetch order status from Cashfree
    const cashfreeResponse = await axios.get(
      `${CASHFREE_API_URL}/orders/${orderId}`,
      {
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
        },
      }
    );

    const orderDetails = cashfreeResponse.data;

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
        status: orderDetails.order_status === 'PAID' ? 'success' : orderDetails.order_status.toLowerCase(),
        gatewayResponse: orderDetails,
        processedAt: new Date(),
      }
    );

    if (orderDetails.order_status === 'PAID') {
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
    } else if (orderDetails.order_status === 'ACTIVE') {
      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment is still pending',
        data: {
          paymentStatus: 'pending',
          orderStatus: orderDetails.order_status,
        },
      });
    } else {
      // Payment failed
      purchase.paymentStatus = 'failed';
      await purchase.save();

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: false,
        message: 'Payment failed',
        data: {
          paymentStatus: 'failed',
          orderStatus: orderDetails.order_status,
        },
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error.response?.data || error.message);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to verify payment',
      data: null,
    });
  }
});

// Cashfree Webhook handler for video payments
const handleVideoPaymentWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;
  const rawBody = JSON.stringify(req.body);

  // Verify webhook signature
  const signatureData = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac('sha256', CASHFREE_SECRET_KEY!)
    .update(signatureData)
    .digest('base64');

  if (signature !== expectedSignature) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const { data, type } = req.body;

  if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
    const orderId = data.order.order_id;

    // Find and update purchase
    const purchase = await VideoPurchase.findOne({ transactionId: orderId });
    if (purchase && purchase.paymentStatus !== 'completed') {
      purchase.paymentStatus = 'completed';
      await purchase.save();

      // Update transaction
      await VideoPaymentTransaction.findOneAndUpdate(
        { gatewayTransactionId: orderId },
        {
          status: 'success',
          gatewayResponse: data,
          processedAt: new Date(),
        }
      );
    }
  } else if (type === 'PAYMENT_FAILED_WEBHOOK') {
    const orderId = data.order.order_id;

    await VideoPurchase.findOneAndUpdate(
      { transactionId: orderId },
      { paymentStatus: 'failed' }
    );

    await VideoPaymentTransaction.findOneAndUpdate(
      { gatewayTransactionId: orderId },
      {
        status: 'failed',
        gatewayResponse: data,
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
    const refundId = `VREF${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

    const refundResponse = await axios.post(
      `${CASHFREE_API_URL}/orders/${purchase.transactionId}/refunds`,
      {
        refund_id: refundId,
        refund_amount: purchase.amount,
        refund_note: reason || 'Customer requested refund',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
        },
      }
    );

    // Update purchase status
    purchase.paymentStatus = 'refunded';
    await purchase.save();

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Refund initiated successfully',
      data: refundResponse.data,
    });
  } catch (error: any) {
    console.error('Refund error:', error.response?.data || error.message);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to initiate refund',
      data: error.response?.data || null,
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

export const WatchVideoPaymentController = {
  createVideoPaymentOrder,
  verifyVideoPayment,
  handleVideoPaymentWebhook,
  getVideoPaymentStatus,
  initiateVideoRefund,
  getAllPurchases,
  getVendorPurchases,
};
