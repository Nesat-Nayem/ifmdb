/**
 * Razorpay Payment Gateway Service
 * Unified payment gateway for both Indian and International users
 * 
 * Razorpay supports:
 * - Indian payments (UPI, Cards, Netbanking, Wallets)
 * - International payments (Cards, PayPal)
 * - Multi-currency support
 * - Automatic payment verification
 * - Webhooks for payment status
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * Generate unique order ID for Razorpay
 */
export const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `order_${timestamp}${randomStr}`.toUpperCase();
};

/**
 * Supported currencies by Razorpay
 */
export const RAZORPAY_SUPPORTED_CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'CHF',
  'SEK', 'DKK', 'NOK', 'HKD', 'NZD', 'SAR', 'QAR', 'OMR', 'KWD', 'BHD',
  'MYR', 'THB', 'ZAR', 'PHP', 'IDR', 'BRL', 'MXN', 'PLN', 'CZK', 'TRY',
  'ILS', 'KRW', 'CNY', 'BDT', 'PKR', 'LKR', 'NPR', 'VND'
];

/**
 * Check if a currency is supported by Razorpay
 */
export const isCurrencySupported = (currency: string): boolean => {
  return RAZORPAY_SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
};

/**
 * Get currency for country code
 */
export const getCurrencyForCountry = (countryCode: string): string => {
  const currencyMap: Record<string, string> = {
    'IN': 'INR',
    'US': 'USD',
    'GB': 'GBP',
    'EU': 'EUR',
    'AE': 'AED',
    'SG': 'SGD',
    'AU': 'AUD',
    'CA': 'CAD',
    'JP': 'JPY',
    'CH': 'CHF',
    'SE': 'SEK',
    'DK': 'DKK',
    'NO': 'NOK',
    'HK': 'HKD',
    'NZ': 'NZD',
    'SA': 'SAR',
    'QA': 'QAR',
    'OM': 'OMR',
    'KW': 'KWD',
    'BH': 'BHD',
    'MY': 'MYR',
    'TH': 'THB',
    'ZA': 'ZAR',
    'PH': 'PHP',
    'ID': 'IDR',
    'BR': 'BRL',
    'MX': 'MXN',
    'PL': 'PLN',
    'CZ': 'CZK',
    'TR': 'TRY',
    'IL': 'ILS',
    'KR': 'KRW',
    'CN': 'CNY',
    'BD': 'BDT',
    'PK': 'PKR',
    'LK': 'LKR',
    'NP': 'NPR',
    'VN': 'VND',
  };

  return currencyMap[countryCode.toUpperCase()] || 'INR';
};

export interface RazorpayOrderParams {
  amount: number; // Amount in smallest currency unit (paise for INR, cents for USD)
  currency: string;
  receipt: string; // Unique receipt ID
  notes?: Record<string, string>; // Custom notes
  paymentCapture?: 0 | 1; // 0 = manual, 1 = automatic
}

/**
 * Create Razorpay order
 */
export const createOrder = async (params: RazorpayOrderParams): Promise<any> => {
  try {
    // Convert amount to smallest currency unit (paise for INR, cents for others)
    const amountInSmallestUnit = Math.round(params.amount * 100);

    const orderOptions = {
      amount: amountInSmallestUnit,
      currency: params.currency.toUpperCase(),
      receipt: params.receipt,
      notes: params.notes || {},
      payment_capture: params.paymentCapture !== undefined ? params.paymentCapture : 1,
    };

    const order = await razorpayInstance.orders.create(orderOptions);
    return order;
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    throw new Error(error.error?.description || 'Failed to create Razorpay order');
  }
};

/**
 * Fetch order details from Razorpay
 */
export const fetchOrder = async (orderId: string): Promise<any> => {
  try {
    const order = await razorpayInstance.orders.fetch(orderId);
    return order;
  } catch (error: any) {
    console.error('Razorpay fetch order error:', error);
    throw new Error(error.error?.description || 'Failed to fetch order');
  }
};

/**
 * Fetch all payments for an order
 */
export const fetchOrderPayments = async (orderId: string): Promise<any> => {
  try {
    const payments = await razorpayInstance.orders.fetchPayments(orderId);
    return payments;
  } catch (error: any) {
    console.error('Razorpay fetch payments error:', error);
    throw new Error(error.error?.description || 'Failed to fetch payments');
  }
};

/**
 * Verify payment signature
 * This is crucial for security - always verify on backend
 */
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  try {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Verify webhook signature
 * Ensures webhook is genuinely from Razorpay
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string = RAZORPAY_KEY_SECRET
): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

/**
 * Fetch payment details
 */
export const fetchPayment = async (paymentId: string): Promise<any> => {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    console.error('Razorpay fetch payment error:', error);
    throw new Error(error.error?.description || 'Failed to fetch payment');
  }
};

/**
 * Capture payment (for manual capture mode)
 */
export const capturePayment = async (
  paymentId: string,
  amount: number,
  currency: string
): Promise<any> => {
  try {
    const amountInSmallestUnit = Math.round(amount * 100);
    const payment = await razorpayInstance.payments.capture(
      paymentId,
      amountInSmallestUnit,
      currency.toUpperCase()
    );
    return payment;
  } catch (error: any) {
    console.error('Razorpay capture payment error:', error);
    throw new Error(error.error?.description || 'Failed to capture payment');
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
): Promise<any> => {
  try {
    const refundOptions: any = {
      notes: notes || {},
    };

    if (amount) {
      refundOptions.amount = Math.round(amount * 100);
    }

    const refund = await razorpayInstance.payments.refund(paymentId, refundOptions);
    return refund;
  } catch (error: any) {
    console.error('Razorpay refund error:', error);
    throw new Error(error.error?.description || 'Failed to refund payment');
  }
};

/**
 * Fetch refund details
 */
export const fetchRefund = async (paymentId: string, refundId: string): Promise<any> => {
  try {
    const refund = await razorpayInstance.payments.fetchRefund(paymentId, refundId);
    return refund;
  } catch (error: any) {
    console.error('Razorpay fetch refund error:', error);
    throw new Error(error.error?.description || 'Failed to fetch refund');
  }
};

/**
 * Check if Razorpay is configured
 */
export const isRazorpayConfigured = (): boolean => {
  return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
};

/**
 * Get Razorpay configuration status
 */
export const getConfigStatus = (): {
  isConfigured: boolean;
  keyId: boolean;
  keySecret: boolean;
} => {
  return {
    isConfigured: isRazorpayConfigured(),
    keyId: !!RAZORPAY_KEY_ID,
    keySecret: !!RAZORPAY_KEY_SECRET,
  };
};

/**
 * Get Razorpay Key ID for frontend
 */
export const getRazorpayKeyId = (): string => {
  return RAZORPAY_KEY_ID;
};

export default {
  createOrder,
  fetchOrder,
  fetchOrderPayments,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPayment,
  capturePayment,
  refundPayment,
  fetchRefund,
  isRazorpayConfigured,
  getConfigStatus,
  getRazorpayKeyId,
  generateOrderId,
  isCurrencySupported,
  getCurrencyForCountry,
  RAZORPAY_SUPPORTED_CURRENCIES,
};
