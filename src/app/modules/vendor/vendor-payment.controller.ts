import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { VendorPackage } from './vendorPackage.model';
import { VendorApplication } from './vendor.model';
import { appError } from '../../errors/appError';

// Cashfree API Configuration
const CASHFREE_API_URL = process.env.CASHFREE_ENV === 'production' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// Generate unique order ID for Cashfree
const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `VND${timestamp}${randomStr}`.toUpperCase();
};

// Create Cashfree order for vendor package payment
export const createVendorPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { packageId, customerDetails, returnUrl } = req.body;

    if (!packageId || !customerDetails) {
      return next(new appError('Package ID and customer details are required', 400));
    }

    // Validate package
    const pkg = await VendorPackage.findById(packageId);
    if (!pkg || !pkg.isActive) {
      return next(new appError('Package not found or inactive', 404));
    }

    const orderId = generateOrderId();
    const amount = pkg.price;

    // Create Cashfree order
    const cashfreeResponse = await axios.post(
      `${CASHFREE_API_URL}/orders`,
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: customerDetails.email.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20),
          customer_name: customerDetails.name,
          customer_email: customerDetails.email,
          customer_phone: customerDetails.phone,
        },
        order_meta: {
          return_url: returnUrl || `${process.env.FRONTEND_URL}/become-vendor/payment-success?order_id={order_id}`,
          notify_url: `${process.env.BACKEND_URL}/v1/api/vendors/payment/webhook`,
        },
        order_note: `Vendor Package: ${pkg.name}`,
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

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Payment order created successfully',
      data: {
        orderId: cashfreeOrder.order_id,
        sessionId: cashfreeOrder.payment_session_id,
        orderAmount: amount,
        packageId: pkg._id,
        packageName: pkg.name,
      },
    });
  } catch (error: any) {
    console.error('Cashfree order error:', error.response?.data || error.message);
    return next(new appError(error.response?.data?.message || 'Failed to create payment order', 500));
  }
};

// Verify Cashfree payment status
export const verifyVendorPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return next(new appError('Order ID is required', 400));
    }

    // Get payment status from Cashfree
    const cashfreeResponse = await axios.get(
      `${CASHFREE_API_URL}/orders/${orderId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
        },
      }
    );

    const orderData = cashfreeResponse.data;
    const isPaid = orderData.order_status === 'PAID';

    res.json({
      success: true,
      statusCode: 200,
      message: isPaid ? 'Payment successful' : 'Payment not completed',
      data: {
        orderId: orderData.order_id,
        orderStatus: orderData.order_status,
        orderAmount: orderData.order_amount,
        isPaid,
        transactionId: orderData.cf_order_id,
      },
    });
  } catch (error: any) {
    console.error('Payment verification error:', error.response?.data || error.message);
    return next(new appError('Failed to verify payment', 500));
  }
};

// Webhook handler for Cashfree
export const handleVendorPaymentWebhook = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    
    if (data?.order?.order_status === 'PAID') {
      console.log('Vendor payment webhook received:', data.order.order_id);
      // Payment confirmed via webhook
      // The actual form submission happens from frontend after verifyVendorPayment
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ success: true }); // Always return 200 to acknowledge
  }
};

export const VendorPaymentController = {
  createVendorPaymentOrder,
  verifyVendorPayment,
  handleVendorPaymentWebhook,
};
