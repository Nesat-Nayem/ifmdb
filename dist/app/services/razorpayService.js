"use strict";
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
exports.getRazorpayKeyId = exports.getConfigStatus = exports.isRazorpayConfigured = exports.fetchRefund = exports.refundPayment = exports.capturePayment = exports.fetchPayment = exports.verifyWebhookSignature = exports.verifyPaymentSignature = exports.fetchOrderPayments = exports.fetchOrder = exports.createOrderWithTransfers = exports.createOrder = exports.getCurrencyForCountry = exports.isCurrencySupported = exports.RAZORPAY_SUPPORTED_CURRENCIES = exports.generateOrderId = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
// Initialize Razorpay instance
const razorpayInstance = new razorpay_1.default({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});
/**
 * Generate unique order ID for Razorpay
 */
const generateOrderId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `order_${timestamp}${randomStr}`.toUpperCase();
};
exports.generateOrderId = generateOrderId;
/**
 * Supported currencies by Razorpay
 */
exports.RAZORPAY_SUPPORTED_CURRENCIES = [
    'INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'CHF',
    'SEK', 'DKK', 'NOK', 'HKD', 'NZD', 'SAR', 'QAR', 'OMR', 'KWD', 'BHD',
    'MYR', 'THB', 'ZAR', 'PHP', 'IDR', 'BRL', 'MXN', 'PLN', 'CZK', 'TRY',
    'ILS', 'KRW', 'CNY', 'BDT', 'PKR', 'LKR', 'NPR', 'VND'
];
/**
 * Check if a currency is supported by Razorpay
 */
const isCurrencySupported = (currency) => {
    return exports.RAZORPAY_SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
};
exports.isCurrencySupported = isCurrencySupported;
/**
 * Get currency for country code
 */
const getCurrencyForCountry = (countryCode) => {
    // All payments are processed in INR only (Razorpay Route requires INR)
    return 'INR';
};
exports.getCurrencyForCountry = getCurrencyForCountry;
/**
 * Create Razorpay order
 */
const createOrder = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const order = yield razorpayInstance.orders.create(orderOptions);
        return order;
    }
    catch (error) {
        console.error('Razorpay order creation error:', error);
        throw new Error(((_a = error.error) === null || _a === void 0 ? void 0 : _a.description) || 'Failed to create Razorpay order');
    }
});
exports.createOrder = createOrder;
/**
 * Create Razorpay order with Route transfers (split payment)
 * The transfers array tells Razorpay to automatically split funds to linked accounts
 * after the payment is captured.
 */
const createOrderWithTransfers = (params, transfers) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const amountInSmallestUnit = Math.round(params.amount * 100);
        const orderOptions = {
            amount: amountInSmallestUnit,
            currency: 'INR', // Route only supports INR
            receipt: params.receipt,
            notes: params.notes || {},
            payment_capture: params.paymentCapture !== undefined ? params.paymentCapture : 1,
            transfers: transfers.map(t => {
                var _a;
                return ({
                    account: t.account,
                    amount: t.amount,
                    currency: t.currency || 'INR',
                    notes: t.notes || {},
                    linked_account_notes: t.linked_account_notes || (t.notes ? Object.keys(t.notes) : []),
                    on_hold: (_a = t.on_hold) !== null && _a !== void 0 ? _a : false,
                    on_hold_until: t.on_hold_until || undefined,
                });
            }),
        };
        const order = yield razorpayInstance.orders.create(orderOptions);
        return order;
    }
    catch (error) {
        console.error('Razorpay order with transfers creation error:', error);
        throw new Error(((_a = error.error) === null || _a === void 0 ? void 0 : _a.description) || 'Failed to create Razorpay order with transfers');
    }
});
exports.createOrderWithTransfers = createOrderWithTransfers;
/**
 * Fetch order details from Razorpay
 */
const fetchOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const order = yield razorpayInstance.orders.fetch(orderId);
        return order;
    }
    catch (error) {
        console.error('Razorpay fetch order error:', error);
        throw new Error(((_a = error.error) === null || _a === void 0 ? void 0 : _a.description) || 'Failed to fetch order');
    }
});
exports.fetchOrder = fetchOrder;
/**
 * Fetch all payments for an order
 */
const fetchOrderPayments = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const payments = yield razorpayInstance.orders.fetchPayments(orderId);
        return payments;
    }
    catch (error) {
        console.error('Razorpay fetch payments error:', error);
        throw new Error(((_a = error.error) === null || _a === void 0 ? void 0 : _a.description) || 'Failed to fetch payments');
    }
});
exports.fetchOrderPayments = fetchOrderPayments;
/**
 * Verify payment signature
 * This is crucial for security - always verify on backend
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    try {
        const text = `${orderId}|${paymentId}`;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');
        return expectedSignature === signature;
    }
    catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
};
exports.verifyPaymentSignature = verifyPaymentSignature;
/**
 * Verify webhook signature
 * Ensures webhook is genuinely from Razorpay
 */
const verifyWebhookSignature = (payload, signature, secret = RAZORPAY_KEY_SECRET) => {
    try {
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        return expectedSignature === signature;
    }
    catch (error) {
        console.error('Webhook signature verification error:', error);
        return false;
    }
};
exports.verifyWebhookSignature = verifyWebhookSignature;
/**
 * Fetch payment details
 */
const fetchPayment = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const payment = yield razorpayInstance.payments.fetch(paymentId);
        return payment;
    }
    catch (error) {
        console.error('Razorpay fetch payment error:', error);
        throw new Error(((_a = error.error) === null || _a === void 0 ? void 0 : _a.description) || 'Failed to fetch payment');
    }
});
exports.fetchPayment = fetchPayment;
/**
 * Capture payment (for manual capture mode)
 */
const capturePayment = (paymentId, amount, currency) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const amountInSmallestUnit = Math.round(amount * 100);
        const payment = yield razorpayInstance.payments.capture(paymentId, amountInSmallestUnit, currency.toUpperCase());
        return payment;
    }
    catch (error) {
        console.error('Razorpay capture payment error:', error);
        throw new Error(((_a = error.error) === null || _a === void 0 ? void 0 : _a.description) || 'Failed to capture payment');
    }
});
exports.capturePayment = capturePayment;
/**
 * Refund payment
 */
const refundPayment = (paymentId, amount, notes) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const refundOptions = {
            notes: notes || {},
        };
        if (amount) {
            refundOptions.amount = Math.round(amount * 100);
        }
        const refund = yield razorpayInstance.payments.refund(paymentId, refundOptions);
        return refund;
    }
    catch (error) {
        console.error('Razorpay refund error:', error);
        throw new Error(((_a = error.error) === null || _a === void 0 ? void 0 : _a.description) || 'Failed to refund payment');
    }
});
exports.refundPayment = refundPayment;
/**
 * Fetch refund details
 */
const fetchRefund = (paymentId, refundId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const refund = yield razorpayInstance.payments.fetchRefund(paymentId, refundId);
        return refund;
    }
    catch (error) {
        console.error('Razorpay fetch refund error:', error);
        throw new Error(((_a = error.error) === null || _a === void 0 ? void 0 : _a.description) || 'Failed to fetch refund');
    }
});
exports.fetchRefund = fetchRefund;
/**
 * Check if Razorpay is configured
 */
const isRazorpayConfigured = () => {
    return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
};
exports.isRazorpayConfigured = isRazorpayConfigured;
/**
 * Get Razorpay configuration status
 */
const getConfigStatus = () => {
    return {
        isConfigured: (0, exports.isRazorpayConfigured)(),
        keyId: !!RAZORPAY_KEY_ID,
        keySecret: !!RAZORPAY_KEY_SECRET,
    };
};
exports.getConfigStatus = getConfigStatus;
/**
 * Get Razorpay Key ID for frontend
 */
const getRazorpayKeyId = () => {
    return RAZORPAY_KEY_ID;
};
exports.getRazorpayKeyId = getRazorpayKeyId;
exports.default = {
    createOrder: exports.createOrder,
    createOrderWithTransfers: exports.createOrderWithTransfers,
    fetchOrder: exports.fetchOrder,
    fetchOrderPayments: exports.fetchOrderPayments,
    verifyPaymentSignature: exports.verifyPaymentSignature,
    verifyWebhookSignature: exports.verifyWebhookSignature,
    fetchPayment: exports.fetchPayment,
    capturePayment: exports.capturePayment,
    refundPayment: exports.refundPayment,
    fetchRefund: exports.fetchRefund,
    isRazorpayConfigured: exports.isRazorpayConfigured,
    getConfigStatus: exports.getConfigStatus,
    getRazorpayKeyId: exports.getRazorpayKeyId,
    generateOrderId: exports.generateOrderId,
    isCurrencySupported: exports.isCurrencySupported,
    getCurrencyForCountry: exports.getCurrencyForCountry,
    RAZORPAY_SUPPORTED_CURRENCIES: exports.RAZORPAY_SUPPORTED_CURRENCIES,
};
