import { NextFunction, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { VendorApplication } from './vendor.model';
import { VendorPackage } from './vendorPackage.model';
import { User } from '../auth/auth.model';
import { appError } from '../../errors/appError';
import { userInterface } from '../../middlewares/userInterface';
import {
  computeDurationDays,
  addDays,
  getFilmTradeServiceStatus,
  invalidateExpiredFilmTradeCache,
  computeActiveServicesForVendor,
} from './subscription.util';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const generateReceiptId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `SUB_${timestamp}_${randomStr}`.toUpperCase();
};

/**
 * GET /vendors/my-subscription
 * Returns the authenticated vendor's film_trade subscription details + payment history,
 * along with all currently available packages (for renewal selection).
 */
export const getMySubscription = async (
  req: userInterface,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return next(new appError('Only vendors can access subscriptions', 403));
    }

    const app = await VendorApplication.findOne({
      vendorUserId: req.user._id,
      isDeleted: false,
      status: 'approved',
    }).populate('selectedServices.packageId');

    if (!app) {
      return next(new appError('Approved vendor application not found', 404));
    }

    const filmTradeSvc = (app.selectedServices as any[]).find(
      (s) => s.serviceType === 'film_trade'
    );

    if (!filmTradeSvc) {
      return res.json({
        success: true,
        statusCode: 200,
        message: 'No film trade subscription for this vendor',
        data: {
          hasFilmTrade: false,
          subscription: null,
          packages: [],
        },
      });
    }

    const status = getFilmTradeServiceStatus(filmTradeSvc);
    const packages = await VendorPackage.find({ isActive: true }).sort({
      sortOrder: 1,
      price: 1,
    });

    // Calculate "days remaining" / "days overdue" for UI display
    let daysRemaining: number | null = null;
    let daysOverdue: number | null = null;
    if (filmTradeSvc.subscriptionEnd) {
      const diffMs =
        new Date(filmTradeSvc.subscriptionEnd).getTime() - Date.now();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (days >= 0) daysRemaining = days;
      else daysOverdue = Math.abs(days);
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Subscription retrieved successfully',
      data: {
        hasFilmTrade: true,
        subscription: {
          packageId: filmTradeSvc.packageId,
          packageName: filmTradeSvc.packageName,
          subscriptionStart: filmTradeSvc.subscriptionStart,
          subscriptionEnd: filmTradeSvc.subscriptionEnd,
          status,
          daysRemaining,
          daysOverdue,
          lastRenewedAt: filmTradeSvc.lastRenewedAt,
          paymentHistory: (filmTradeSvc.paymentHistory || []).slice().reverse(),
        },
        packages,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /vendors/my-subscription/renew/create-order
 * Body: { packageId }
 * Creates a Razorpay order for renewing the vendor's film_trade subscription.
 * The packageId is validated and the order amount is derived server-side.
 */
export const createRenewalOrder = async (
  req: userInterface,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return next(new appError('Only vendors can create renewal orders', 403));
    }

    const { packageId } = req.body;
    if (!packageId) return next(new appError('packageId is required', 400));

    const app = await VendorApplication.findOne({
      vendorUserId: req.user._id,
      isDeleted: false,
      status: 'approved',
    });
    if (!app) return next(new appError('Approved vendor application not found', 404));

    const svc = (app.selectedServices as any[]).find(
      (s) => s.serviceType === 'film_trade'
    );
    if (!svc) return next(new appError('Film trade service is not active on this vendor', 400));

    const pkg = await VendorPackage.findById(packageId);
    if (!pkg || !pkg.isActive) {
      return next(new appError('Package not found or inactive', 404));
    }

    const receiptId = generateReceiptId();
    const order = await razorpay.orders.create({
      amount: pkg.price * 100,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        type: 'film_trade_renewal',
        vendorUserId: String(req.user._id),
        applicationId: String(app._id),
        packageId: String(pkg._id),
        packageName: pkg.name,
      },
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Renewal order created successfully',
      data: {
        orderId: receiptId,
        razorpayOrderId: order.id,
        amount: pkg.price,
        currency: order.currency,
        packageId: pkg._id,
        packageName: pkg.name,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err: any) {
    console.error('Renewal order error:', err?.message);
    next(new appError(err?.message || 'Failed to create renewal order', 500));
  }
};

/**
 * POST /vendors/my-subscription/renew/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId }
 * Verifies the payment signature and extends the subscription.
 */
export const verifyRenewal = async (
  req: userInterface,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return next(new appError('Only vendors can renew subscriptions', 403));
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !packageId) {
      return next(new appError('Missing payment verification details', 400));
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return next(new appError('Invalid payment signature', 400));
    }

    const app = await VendorApplication.findOne({
      vendorUserId: req.user._id,
      isDeleted: false,
      status: 'approved',
    });
    if (!app) return next(new appError('Approved vendor application not found', 404));

    const svcIdx = (app.selectedServices as any[]).findIndex(
      (s) => s.serviceType === 'film_trade'
    );
    if (svcIdx < 0) return next(new appError('Film trade service not found', 400));

    const svc = (app.selectedServices as any[])[svcIdx];
    const pkg = await VendorPackage.findById(packageId).lean();
    if (!pkg) return next(new appError('Package not found', 404));

    const now = new Date();
    const days = computeDurationDays(pkg.duration, pkg.durationType as any);

    // If the existing subscription is still valid, extend from its end date.
    // Otherwise (expired), start a fresh period from now.
    const currentEnd = svc.subscriptionEnd ? new Date(svc.subscriptionEnd) : null;
    const periodStart = currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
    const periodEnd = addDays(periodStart, days);

    svc.packageId = pkg._id;
    svc.packageName = pkg.name;
    svc.packagePrice = pkg.price;
    if (!svc.subscriptionStart) svc.subscriptionStart = now;
    svc.subscriptionEnd = periodEnd;
    svc.subscriptionStatus = 'active';
    svc.lastRenewedAt = now;
    svc.paymentHistory = Array.isArray(svc.paymentHistory) ? svc.paymentHistory : [];
    svc.paymentHistory.push({
      transactionId: razorpay_payment_id,
      amount: pkg.price,
      status: 'completed',
      paymentMethod: 'razorpay',
      paidAt: now,
      type: 'renewal',
      packageId: pkg._id,
      packageName: pkg.name,
      durationDays: days,
      periodStart,
      periodEnd,
    });

    (app.selectedServices as any[])[svcIdx] = svc;
    app.markModified('selectedServices');
    await app.save();
    invalidateExpiredFilmTradeCache();

    // Refresh activeServices on the linked User so the menu updates next login.
    try {
      const active = await computeActiveServicesForVendor(req.user._id as any);
      await User.findByIdAndUpdate(req.user._id, { vendorActiveServices: active });
    } catch (e) {
      // non-fatal
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Subscription renewed successfully',
      data: {
        subscriptionEnd: svc.subscriptionEnd,
        lastRenewedAt: svc.lastRenewedAt,
        packageName: svc.packageName,
        amount: pkg.price,
      },
    });
  } catch (err: any) {
    console.error('Renewal verify error:', err?.message);
    next(new appError(err?.message || 'Failed to verify renewal', 500));
  }
};

export const SubscriptionController = {
  getMySubscription,
  createRenewalOrder,
  verifyRenewal,
};
