"use strict";
/**
 * CCAvenue Payment Gateway Service
 * For international (non-Indian) users
 *
 * CCAvenue uses a non-seamless integration method:
 * 1. Encrypt payment data using AES-128-CBC
 * 2. POST to CCAvenue checkout page
 * 3. User completes payment on CCAvenue
 * 4. CCAvenue redirects back with encrypted response
 * 5. Decrypt and process the response
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigStatus = exports.shouldUseCCAvenue = exports.verifyResponseIntegrity = exports.processCallbackResponse = exports.parseResponse = exports.createEncryptedRequest = exports.createOrderDataString = exports.getCCAvenueAmount = exports.isCurrencySupported = exports.CCAVENUE_SUPPORTED_CURRENCIES = exports.generateCCOrderId = exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
// CCAvenue Configuration
const CCAVENUE_MERCHANT_ID = process.env.CCAVENUE_MERCHANT_ID || '';
const CCAVENUE_ACCESS_CODE = process.env.CCAVENUE_ACCESS_CODE || '';
const CCAVENUE_WORKING_KEY = process.env.CCAVENUE_WORKING_KEY || '';
const CCAVENUE_REDIRECT_URL = process.env.CCAVENUE_REDIRECT_URL || '';
const CCAVENUE_CANCEL_URL = process.env.CCAVENUE_CANCEL_URL || '';
// CCAvenue URLs
const CCAVENUE_URL = process.env.CCAVENUE_ENV === 'production'
    ? 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction'
    : 'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
/**
 * Encrypt data using CCAvenue's encryption method
 * Uses AES-128-CBC with MD5 hash of working key
 */
const encrypt = (plainText, workingKey = CCAVENUE_WORKING_KEY) => {
    const m = crypto_1.default.createHash('md5');
    m.update(workingKey);
    const key = m.digest();
    const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
    const cipher = crypto_1.default.createCipheriv('aes-128-cbc', key, iv);
    let encoded = cipher.update(plainText, 'utf8', 'hex');
    encoded += cipher.final('hex');
    return encoded;
};
exports.encrypt = encrypt;
/**
 * Decrypt data using CCAvenue's decryption method
 * Uses AES-128-CBC with MD5 hash of working key
 */
const decrypt = (encryptedText, workingKey = CCAVENUE_WORKING_KEY) => {
    const m = crypto_1.default.createHash('md5');
    m.update(workingKey);
    const key = m.digest();
    const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
    const decipher = crypto_1.default.createDecipheriv('aes-128-cbc', key, iv);
    let decoded = decipher.update(encryptedText, 'hex', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
};
exports.decrypt = decrypt;
/**
 * Generate unique order ID for CCAvenue
 */
const generateCCOrderId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `CC${timestamp}${randomStr}`.toUpperCase();
};
exports.generateCCOrderId = generateCCOrderId;
/**
 * Supported currencies for CCAvenue international payments
 */
exports.CCAVENUE_SUPPORTED_CURRENCIES = [
    'USD', 'GBP', 'EUR', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'CHF', 'SEK',
    'DKK', 'NOK', 'HKD', 'NZD', 'SAR', 'QAR', 'OMR', 'KWD', 'BHD', 'MYR',
    'THB', 'ZAR', 'KES', 'GHS', 'NGN', 'EGP', 'PHP', 'IDR', 'BRL', 'MXN',
    'CLP', 'COP', 'PEN', 'ARS', 'PLN', 'CZK', 'RUB', 'TRY', 'ILS', 'KRW',
    'CNY', 'BDT', 'PKR', 'LKR', 'NPR', 'VND'
];
/**
 * Check if a currency is supported by CCAvenue
 */
const isCurrencySupported = (currency) => {
    return exports.CCAVENUE_SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
};
exports.isCurrencySupported = isCurrencySupported;
/**
 * Convert currency to INR for CCAvenue processing if needed
 * CCAvenue handles multi-currency internally
 */
const getCCAvenueAmount = (amount, currency) => {
    // CCAvenue supports multi-currency, so we pass the original amount and currency
    // CCAvenue will handle the conversion on their end
    if ((0, exports.isCurrencySupported)(currency)) {
        return { amount, currency: currency.toUpperCase() };
    }
    // Fallback to USD for unsupported currencies
    return { amount, currency: 'USD' };
};
exports.getCCAvenueAmount = getCCAvenueAmount;
/**
 * Create CCAvenue order data string
 */
const createOrderDataString = (params) => {
    const data = {
        merchant_id: CCAVENUE_MERCHANT_ID,
        order_id: params.orderId,
        currency: params.currency,
        amount: params.amount.toFixed(2),
        redirect_url: params.redirectUrl || CCAVENUE_REDIRECT_URL,
        cancel_url: params.cancelUrl || CCAVENUE_CANCEL_URL,
        language: 'EN',
        billing_name: params.customerName,
        billing_email: params.customerEmail,
        billing_tel: params.customerPhone,
    };
    // Optional billing address fields
    if (params.billingAddress)
        data.billing_address = params.billingAddress;
    if (params.billingCity)
        data.billing_city = params.billingCity;
    if (params.billingState)
        data.billing_state = params.billingState;
    if (params.billingZip)
        data.billing_zip = params.billingZip;
    if (params.billingCountry)
        data.billing_country = params.billingCountry;
    // Custom merchant parameters for tracking
    if (params.merchantParam1)
        data.merchant_param1 = params.merchantParam1;
    if (params.merchantParam2)
        data.merchant_param2 = params.merchantParam2;
    if (params.merchantParam3)
        data.merchant_param3 = params.merchantParam3;
    if (params.merchantParam4)
        data.merchant_param4 = params.merchantParam4;
    if (params.merchantParam5)
        data.merchant_param5 = params.merchantParam5;
    // Convert to query string format
    return Object.entries(data)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
};
exports.createOrderDataString = createOrderDataString;
/**
 * Create encrypted request for CCAvenue
 */
const createEncryptedRequest = (params) => {
    const orderDataString = (0, exports.createOrderDataString)(params);
    const encRequest = (0, exports.encrypt)(orderDataString);
    return {
        encRequest,
        accessCode: CCAVENUE_ACCESS_CODE,
        ccavenueUrl: CCAVENUE_URL,
    };
};
exports.createEncryptedRequest = createEncryptedRequest;
/**
 * Parse CCAvenue response after decryption
 */
const parseResponse = (decryptedResponse) => {
    const params = {};
    decryptedResponse.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        if (key && value !== undefined) {
            params[key] = decodeURIComponent(value);
        }
    });
    return params;
};
exports.parseResponse = parseResponse;
/**
 * Process CCAvenue callback response
 */
const processCallbackResponse = (encResponse) => {
    const decryptedResponse = (0, exports.decrypt)(encResponse);
    const params = (0, exports.parseResponse)(decryptedResponse);
    return {
        success: params.order_status === 'Success',
        orderId: params.order_id || '',
        trackingId: params.tracking_id || '',
        bankRefNo: params.bank_ref_no || '',
        orderStatus: params.order_status || '',
        failureMessage: params.failure_message || '',
        paymentMode: params.payment_mode || '',
        cardName: params.card_name || '',
        statusCode: params.status_code || '',
        statusMessage: params.status_message || '',
        currency: params.currency || '',
        amount: params.amount || '',
        merchantParam1: params.merchant_param1 || '',
        merchantParam2: params.merchant_param2 || '',
        merchantParam3: params.merchant_param3 || '',
        merchantParam4: params.merchant_param4 || '',
        merchantParam5: params.merchant_param5 || '',
        rawResponse: params,
    };
};
exports.processCallbackResponse = processCallbackResponse;
/**
 * Verify CCAvenue response signature (optional security check)
 */
const verifyResponseIntegrity = (encResponse) => {
    try {
        const decryptedResponse = (0, exports.decrypt)(encResponse);
        // If decryption succeeds, the response is valid
        return decryptedResponse.length > 0;
    }
    catch (error) {
        return false;
    }
};
exports.verifyResponseIntegrity = verifyResponseIntegrity;
/**
 * Check if user should use CCAvenue (non-Indian users)
 */
const shouldUseCCAvenue = (countryCode) => {
    return countryCode.toUpperCase() !== 'IN';
};
exports.shouldUseCCAvenue = shouldUseCCAvenue;
/**
 * Get CCAvenue configuration status
 */
const getConfigStatus = () => {
    return {
        isConfigured: !!(CCAVENUE_MERCHANT_ID && CCAVENUE_ACCESS_CODE && CCAVENUE_WORKING_KEY),
        merchantId: !!CCAVENUE_MERCHANT_ID,
        accessCode: !!CCAVENUE_ACCESS_CODE,
        workingKey: !!CCAVENUE_WORKING_KEY,
        redirectUrl: !!CCAVENUE_REDIRECT_URL,
    };
};
exports.getConfigStatus = getConfigStatus;
exports.default = {
    encrypt: exports.encrypt,
    decrypt: exports.decrypt,
    generateCCOrderId: exports.generateCCOrderId,
    createOrderDataString: exports.createOrderDataString,
    createEncryptedRequest: exports.createEncryptedRequest,
    parseResponse: exports.parseResponse,
    processCallbackResponse: exports.processCallbackResponse,
    verifyResponseIntegrity: exports.verifyResponseIntegrity,
    shouldUseCCAvenue: exports.shouldUseCCAvenue,
    isCurrencySupported: exports.isCurrencySupported,
    getCCAvenueAmount: exports.getCCAvenueAmount,
    getConfigStatus: exports.getConfigStatus,
    CCAVENUE_SUPPORTED_CURRENCIES: exports.CCAVENUE_SUPPORTED_CURRENCIES,
};
