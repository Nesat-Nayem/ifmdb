/**
 * Razorpay Route Service
 * 
 * Handles Razorpay Route (split payments) for vendor payouts.
 * Instead of RazorpayX Payouts, vendors receive payments directly via Route transfers.
 * 
 * Flow:
 * 1. Vendor adds bank details → Creates a Razorpay Linked Account
 * 2. When user pays → Order is created with transfers (split to vendor's linked account)
 * 3. After configurable hold period → Razorpay settles to vendor's bank automatically
 * 
 * Documentation: https://razorpay.com/docs/payments/route/
 */

import axios from 'axios';
import crypto from 'crypto';

// Environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// Configurable settlement hold period (in days) - defaults to 7
const ROUTE_SETTLEMENT_HOLD_DAYS = parseInt(process.env.RAZORPAY_ROUTE_SETTLEMENT_HOLD_DAYS || '7', 10);

// Base URLs
const BASE_URL_V1 = 'https://api.razorpay.com/v1';
const BASE_URL_V2 = 'https://api.razorpay.com/v2';

// Axios clients with Basic Auth
const razorpayClientV1 = axios.create({
  baseURL: BASE_URL_V1,
  headers: { 'Content-Type': 'application/json' },
  auth: { username: RAZORPAY_KEY_ID, password: RAZORPAY_KEY_SECRET },
});

const razorpayClientV2 = axios.create({
  baseURL: BASE_URL_V2,
  headers: { 'Content-Type': 'application/json' },
  auth: { username: RAZORPAY_KEY_ID, password: RAZORPAY_KEY_SECRET },
});

// ==================== TYPES ====================

export interface LinkedAccountParams {
  email: string;
  phone: string;
  legalBusinessName: string;
  contactName: string;
  businessType?: string;
  referenceId?: string;
  // Bank account details for the linked account
  bankAccount?: {
    accountNumber: string;
    ifscCode: string;
    beneficiaryName: string;
  };
}

export interface LinkedAccountResponse {
  success: boolean;
  data?: any;
  accountId?: string;
  message: string;
}

export interface TransferParams {
  account: string; // Linked Account ID (acc_xxxx)
  amount: number; // In paise
  currency?: string;
  notes?: Record<string, string>;
  linkedAccountNotes?: string[];
  onHold?: boolean;
  onHoldUntil?: number; // Unix timestamp in seconds
}

export interface RouteOrderParams {
  amount: number; // In rupees (will be converted to paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
  transfers: TransferParams[];
}

// ==================== LINKED ACCOUNT OPERATIONS ====================

/**
 * Create a Linked Account for a vendor
 * POST /v2/accounts
 */
export const createLinkedAccount = async (params: LinkedAccountParams): Promise<LinkedAccountResponse> => {
  try {
    const payload: any = {
      email: params.email,
      phone: params.phone,
      type: 'route',
      legal_business_name: params.legalBusinessName,
      contact_name: params.contactName,
      customer_facing_business_name: params.legalBusinessName.slice(0, 30),
      business_type: 'proprietorship',
      reference_id: params.referenceId,
      profile: {
        category: 'healthcare',
        subcategory: 'clinic',
        addresses: {
          registered: {
            street1: 'Flat No 405, Raj Residency',
            street2: 'Main Street, Andheri West',
            city: 'Mumbai',
            state: 'MAHARASHTRA',
            postal_code: '400058',
            country: 'IN',
          },
        },
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: '1.1.1.1',
      },
      notes: {
        vendorId: params.referenceId?.replace('V_', ''),
      },
    };

    const response = await razorpayClientV2.post('/accounts', payload);

    return {
      success: true,
      data: response.data,
      accountId: response.data.id,
      message: 'Linked account created successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Create Linked Account Error:', error.response?.data || error.message);

    const errorDesc = (error.response?.data?.error?.description || '').toLowerCase();

    // Handle duplicate email - existing account may be suspended
    if (
      errorDesc.includes('already exists') ||
      errorDesc.includes('already been taken') ||
      errorDesc.includes('duplicate')
    ) {
      // Retry with a modified email using +route suffix (works with most email providers)
      try {
        const [localPart, domain] = params.email.split('@');
        const modifiedEmail = `${localPart}+route${Date.now()}@${domain}`;
        console.log(`Retrying linked account creation with modified email: ${modifiedEmail}`);

        const retryPayload: any = {
          email: modifiedEmail,
          phone: params.phone,
          type: 'route',
          legal_business_name: params.legalBusinessName,
          contact_name: params.contactName,
          customer_facing_business_name: params.legalBusinessName.slice(0, 30),
          business_type: 'proprietorship',
          reference_id: params.referenceId ? `${params.referenceId.slice(0, 6)}${Date.now().toString().slice(-12)}`.slice(0, 20) : undefined,
          profile: {
            category: 'healthcare',
            subcategory: 'clinic',
            addresses: {
              registered: {
                street1: 'Flat No 405, Raj Residency',
                street2: 'Main Street, Andheri West',
                city: 'Mumbai',
                state: 'MAHARASHTRA',
                postal_code: '400058',
                country: 'IN',
              },
            },
          },
          tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: '1.1.1.1',
          },
          notes: {
            vendorId: params.referenceId?.replace('V_', ''),
            retry: 'true'
          },
        };

        const retryResponse = await razorpayClientV2.post('/accounts', retryPayload);
        return {
          success: true,
          data: retryResponse.data,
          accountId: retryResponse.data.id,
          message: 'Linked account created with modified email (original email was in use)',
        };
      } catch (retryErr: any) {
        console.error('Retry with modified email also failed:', retryErr.response?.data || retryErr.message);
        return {
          success: false,
          data: retryErr.response?.data,
          message: retryErr.response?.data?.error?.description || 'Failed to create linked account (email conflict)',
        };
      }
    }

    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to create linked account',
    };
  }
};

/**
 * Submit Linked Account details for activation
 * POST /v2/accounts/:accountId/submit
 */
export const submitAccount = async (accountId: string): Promise<LinkedAccountResponse> => {
  try {
    const response = await razorpayClientV2.post(`/accounts/${accountId}/submit`);
    return {
      success: true,
      data: response.data,
      accountId: accountId,
      message: 'Account submitted for activation successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Submit Account Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to submit account for activation',
    };
  }
};

/**
 * Fetch a Linked Account by ID
 * GET /v2/accounts/:accountId
 */
export const fetchLinkedAccount = async (accountId: string): Promise<LinkedAccountResponse> => {
  try {
    const response = await razorpayClientV2.get(`/accounts/${accountId}`);
    return {
      success: true,
      data: response.data,
      accountId: response.data.id,
      message: 'Linked account fetched successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Fetch Linked Account Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to fetch linked account',
    };
  }
};

/**
 * Delete a Linked Account
 * DELETE /v2/accounts/:accountId
 */
export const deleteLinkedAccount = async (accountId: string): Promise<LinkedAccountResponse> => {
  try {
    const response = await razorpayClientV2.delete(`/accounts/${accountId}`);
    return {
      success: true,
      data: response.data,
      accountId: accountId,
      message: 'Linked account deleted successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Delete Linked Account Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to delete linked account',
    };
  }
};

/**
 * Create a Stakeholder for a Linked Account
 * POST /v2/accounts/:accountId/stakeholders
 * Required step before product configuration can be activated
 */
export const createStakeholder = async (
  accountId: string,
  params: {
    name: string;
    email: string;
    phone?: string;
    dob?: string;
  }
): Promise<LinkedAccountResponse> => {
  try {
    const payload: any = {
      name: params.name,
      email: params.email,
      addresses: {
        residential: {
          street: 'Flat No 405, Raj Residency, Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400058',
          country: 'IN',
        },
      },
      relationship: {
        executive: true,
        director: true,
        percentage_ownership: 100,
      },
      kyc: {
        pan: 'ABCDE1234F',
      },
      notes: {
        role: 'vendor_owner',
        type: 'individual_stakeholder'
      }
    };

    if (params.dob) {
      payload.dob = params.dob; // Format: YYYY-MM-DD
    } else {
      payload.dob = '1990-01-01'; // Default dummy DOB
    }

    if (params.phone) {
      payload.phone = {
        primary: params.phone,
      };
    }

    const response = await razorpayClientV2.post(`/accounts/${accountId}/stakeholders`, payload);

    return {
      success: true,
      data: response.data,
      accountId: accountId,
      message: 'Stakeholder created successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Create Stakeholder Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to create stakeholder',
    };
  }
};

/**
 * Request Product Configuration for a Linked Account (to enable Route)
 * POST /v2/accounts/:accountId/products
 * Only pass product_name and tnc_accepted. Bank details go in the UPDATE step.
 */
export const requestProductConfiguration = async (
  accountId: string
): Promise<LinkedAccountResponse> => {
  try {
    const payload = {
      product_name: 'route',
      tnc_accepted: true,
    };

    const response = await razorpayClientV2.post(`/accounts/${accountId}/products`, payload);

    return {
      success: true,
      data: response.data,
      accountId: accountId,
      message: 'Product configuration requested successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Product Config Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to configure product',
    };
  }
};

/**
 * Update Product Configuration (provide bank details for settlement)
 * PATCH /v2/accounts/:accountId/products/:productId
 * Bank details (settlements) go at top level per Razorpay docs
 */
export const updateProductConfiguration = async (
  accountId: string,
  productId: string,
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    beneficiaryName: string;
  }
): Promise<LinkedAccountResponse> => {
  try {
    const payload = {
      settlements: {
        account_number: bankAccount.accountNumber,
        ifsc_code: bankAccount.ifscCode,
        beneficiary_name: bankAccount.beneficiaryName,
      },
      tnc_accepted: true,
    };

    const response = await razorpayClientV2.patch(
      `/accounts/${accountId}/products/${productId}`,
      payload
    );

    return {
      success: true,
      data: response.data,
      accountId: accountId,
      message: 'Product configuration updated successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Update Product Config Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to update product configuration',
    };
  }
};

// ==================== TRANSFER OPERATIONS ====================

/**
 * Get the settlement hold timestamp based on configurable days
 */
export const getSettlementHoldTimestamp = (): number => {
  const holdMs = ROUTE_SETTLEMENT_HOLD_DAYS * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() + holdMs) / 1000);
};

/**
 * Get configured settlement hold days
 */
export const getSettlementHoldDays = (): number => {
  return ROUTE_SETTLEMENT_HOLD_DAYS;
};

/**
 * Build transfer params for an order
 * Calculates vendor share after platform fee and applies settlement hold
 */
export const buildTransferParams = (
  linkedAccountId: string,
  vendorAmountInPaise: number,
  notes?: Record<string, string>
): TransferParams => {
  const holdTimestamp = getSettlementHoldTimestamp();

  return {
    account: linkedAccountId,
    amount: vendorAmountInPaise,
    currency: 'INR',
    notes: notes || {},
    linkedAccountNotes: notes ? Object.keys(notes) : [],
    onHold: ROUTE_SETTLEMENT_HOLD_DAYS > 0,
    onHoldUntil: ROUTE_SETTLEMENT_HOLD_DAYS > 0 ? holdTimestamp : undefined,
  };
};

/**
 * Create a transfer from a captured payment
 * POST /v1/payments/:paymentId/transfers
 * 
 * Used as fallback when transfers weren't included in the order
 */
export const createTransferFromPayment = async (
  paymentId: string,
  transfers: TransferParams[]
): Promise<LinkedAccountResponse> => {
  try {
    const payload = {
      transfers: transfers.map(t => ({
        account: t.account,
        amount: t.amount,
        currency: t.currency || 'INR',
        notes: t.notes || {},
        linked_account_notes: t.linkedAccountNotes || [],
        on_hold: t.onHold ?? true,
        on_hold_until: t.onHoldUntil,
      })),
    };

    const response = await razorpayClientV1.post(`/payments/${paymentId}/transfers`, payload);

    return {
      success: true,
      data: response.data,
      message: 'Transfer created successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Create Transfer Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to create transfer',
    };
  }
};

/**
 * Fetch transfers for a payment
 * GET /v1/payments/:paymentId/transfers
 */
export const fetchPaymentTransfers = async (paymentId: string): Promise<LinkedAccountResponse> => {
  try {
    const response = await razorpayClientV1.get(`/payments/${paymentId}/transfers`);
    return {
      success: true,
      data: response.data,
      message: 'Transfers fetched successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Fetch Transfers Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to fetch transfers',
    };
  }
};

/**
 * Fetch a specific transfer
 * GET /v1/transfers/:transferId
 */
export const fetchTransfer = async (transferId: string): Promise<LinkedAccountResponse> => {
  try {
    const response = await razorpayClientV1.get(`/transfers/${transferId}`);
    return {
      success: true,
      data: response.data,
      message: 'Transfer fetched successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Fetch Transfer Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to fetch transfer',
    };
  }
};

/**
 * Reverse a transfer (for refunds)
 * POST /v1/transfers/:transferId/reversals
 */
export const reverseTransfer = async (
  transferId: string,
  amount?: number, // In paise, if partial reversal
  notes?: Record<string, string>
): Promise<LinkedAccountResponse> => {
  try {
    const payload: any = { notes: notes || {} };
    if (amount) payload.amount = amount;

    const response = await razorpayClientV1.post(`/transfers/${transferId}/reversals`, payload);

    return {
      success: true,
      data: response.data,
      message: 'Transfer reversed successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Reverse Transfer Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to reverse transfer',
    };
  }
};

// ==================== WEBHOOK VERIFICATION ====================

/**
 * Verify Route webhook signature
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  webhookSecret: string = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET
): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

// ==================== UTILITY ====================

/**
 * Check if Route is configured
 */
export const isRouteConfigured = (): boolean => {
  return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
};

/**
 * Generate a unique reference ID for a vendor linked account
 */
export const generateVendorReferenceId = (vendorId: string): string => {
  // Razorpay reference_id max 20 chars. Use V_ prefix + last 18 chars of vendorId
  const shortId = vendorId.slice(-18);
  return `V_${shortId}`;
};

export default {
  // Linked Accounts
  createLinkedAccount,
  fetchLinkedAccount,
  deleteLinkedAccount,
  submitAccount,
  createStakeholder,
  requestProductConfiguration,
  updateProductConfiguration,
  // Transfers
  getSettlementHoldTimestamp,
  getSettlementHoldDays,
  buildTransferParams,
  createTransferFromPayment,
  fetchPaymentTransfers,
  fetchTransfer,
  reverseTransfer,
  // Webhook
  verifyWebhookSignature,
  // Utility
  isRouteConfigured,
  generateVendorReferenceId,
};
