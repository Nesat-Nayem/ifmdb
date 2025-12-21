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

import crypto from 'crypto';

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
export const encrypt = (plainText: string, workingKey: string = CCAVENUE_WORKING_KEY): string => {
  const m = crypto.createHash('md5');
  m.update(workingKey);
  const key = m.digest();
  const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  let encoded = cipher.update(plainText, 'utf8', 'hex');
  encoded += cipher.final('hex');
  return encoded;
};

/**
 * Decrypt data using CCAvenue's decryption method
 * Uses AES-128-CBC with MD5 hash of working key
 */
export const decrypt = (encryptedText: string, workingKey: string = CCAVENUE_WORKING_KEY): string => {
  const m = crypto.createHash('md5');
  m.update(workingKey);
  const key = m.digest();
  const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  let decoded = decipher.update(encryptedText, 'hex', 'utf8');
  decoded += decipher.final('utf8');
  return decoded;
};

/**
 * Generate unique order ID for CCAvenue
 */
export const generateCCOrderId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `CC${timestamp}${randomStr}`.toUpperCase();
};

/**
 * Supported currencies for CCAvenue international payments
 */
export const CCAVENUE_SUPPORTED_CURRENCIES = [
  'USD', 'GBP', 'EUR', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'CHF', 'SEK',
  'DKK', 'NOK', 'HKD', 'NZD', 'SAR', 'QAR', 'OMR', 'KWD', 'BHD', 'MYR',
  'THB', 'ZAR', 'KES', 'GHS', 'NGN', 'EGP', 'PHP', 'IDR', 'BRL', 'MXN',
  'CLP', 'COP', 'PEN', 'ARS', 'PLN', 'CZK', 'RUB', 'TRY', 'ILS', 'KRW',
  'CNY', 'BDT', 'PKR', 'LKR', 'NPR', 'VND'
];

/**
 * Check if a currency is supported by CCAvenue
 */
export const isCurrencySupported = (currency: string): boolean => {
  return CCAVENUE_SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
};

/**
 * Convert currency to INR for CCAvenue processing if needed
 * CCAvenue handles multi-currency internally
 */
export const getCCAvenueAmount = (amount: number, currency: string): { amount: number; currency: string } => {
  // CCAvenue supports multi-currency, so we pass the original amount and currency
  // CCAvenue will handle the conversion on their end
  if (isCurrencySupported(currency)) {
    return { amount, currency: currency.toUpperCase() };
  }
  // Fallback to USD for unsupported currencies
  return { amount, currency: 'USD' };
};

export interface CCOrderParams {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  redirectUrl?: string;
  cancelUrl?: string;
  merchantParam1?: string; // Custom field for userId
  merchantParam2?: string; // Custom field for videoId/eventId
  merchantParam3?: string; // Custom field for purchaseType (video/event)
  merchantParam4?: string; // Custom field for additional data
  merchantParam5?: string; // Custom field for additional data
}

/**
 * Create CCAvenue order data string
 */
export const createOrderDataString = (params: CCOrderParams): string => {
  const data: Record<string, string> = {
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
  if (params.billingAddress) data.billing_address = params.billingAddress;
  if (params.billingCity) data.billing_city = params.billingCity;
  if (params.billingState) data.billing_state = params.billingState;
  if (params.billingZip) data.billing_zip = params.billingZip;
  if (params.billingCountry) data.billing_country = params.billingCountry;

  // Custom merchant parameters for tracking
  if (params.merchantParam1) data.merchant_param1 = params.merchantParam1;
  if (params.merchantParam2) data.merchant_param2 = params.merchantParam2;
  if (params.merchantParam3) data.merchant_param3 = params.merchantParam3;
  if (params.merchantParam4) data.merchant_param4 = params.merchantParam4;
  if (params.merchantParam5) data.merchant_param5 = params.merchantParam5;

  // Convert to query string format
  return Object.entries(data)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
};

/**
 * Create encrypted request for CCAvenue
 */
export const createEncryptedRequest = (params: CCOrderParams): {
  encRequest: string;
  accessCode: string;
  ccavenueUrl: string;
} => {
  const orderDataString = createOrderDataString(params);
  const encRequest = encrypt(orderDataString);
  
  return {
    encRequest,
    accessCode: CCAVENUE_ACCESS_CODE,
    ccavenueUrl: CCAVENUE_URL,
  };
};

/**
 * Parse CCAvenue response after decryption
 */
export const parseResponse = (decryptedResponse: string): Record<string, string> => {
  const params: Record<string, string> = {};
  decryptedResponse.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      params[key] = decodeURIComponent(value);
    }
  });
  return params;
};

/**
 * Process CCAvenue callback response
 */
export const processCallbackResponse = (encResponse: string): {
  success: boolean;
  orderId: string;
  trackingId: string;
  bankRefNo: string;
  orderStatus: string;
  failureMessage: string;
  paymentMode: string;
  cardName: string;
  statusCode: string;
  statusMessage: string;
  currency: string;
  amount: string;
  merchantParam1: string;
  merchantParam2: string;
  merchantParam3: string;
  merchantParam4: string;
  merchantParam5: string;
  rawResponse: Record<string, string>;
} => {
  const decryptedResponse = decrypt(encResponse);
  const params = parseResponse(decryptedResponse);
  
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

/**
 * Verify CCAvenue response signature (optional security check)
 */
export const verifyResponseIntegrity = (encResponse: string): boolean => {
  try {
    const decryptedResponse = decrypt(encResponse);
    // If decryption succeeds, the response is valid
    return decryptedResponse.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Check if user should use CCAvenue (non-Indian users)
 */
export const shouldUseCCAvenue = (countryCode: string): boolean => {
  return countryCode.toUpperCase() !== 'IN';
};

/**
 * Get CCAvenue configuration status
 */
export const getConfigStatus = (): {
  isConfigured: boolean;
  merchantId: boolean;
  accessCode: boolean;
  workingKey: boolean;
  redirectUrl: boolean;
} => {
  return {
    isConfigured: !!(CCAVENUE_MERCHANT_ID && CCAVENUE_ACCESS_CODE && CCAVENUE_WORKING_KEY),
    merchantId: !!CCAVENUE_MERCHANT_ID,
    accessCode: !!CCAVENUE_ACCESS_CODE,
    workingKey: !!CCAVENUE_WORKING_KEY,
    redirectUrl: !!CCAVENUE_REDIRECT_URL,
  };
};

export default {
  encrypt,
  decrypt,
  generateCCOrderId,
  createOrderDataString,
  createEncryptedRequest,
  parseResponse,
  processCallbackResponse,
  verifyResponseIntegrity,
  shouldUseCCAvenue,
  isCurrencySupported,
  getCCAvenueAmount,
  getConfigStatus,
  CCAVENUE_SUPPORTED_CURRENCIES,
};
