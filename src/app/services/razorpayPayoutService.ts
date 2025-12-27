/**
 * Razorpay Payouts Service (RazorpayX)
 * 
 * Handles automatic vendor withdrawals using Razorpay Payouts API
 * Documentation: https://razorpay.com/docs/api/x/payouts/
 * 
 * Note: RazorpayX requires separate API keys from regular Razorpay payments
 * You can use the same keys if RazorpayX is enabled on your account
 */

import axios from 'axios';
import crypto from 'crypto';

// Environment variables for RazorpayX Payouts
// Can be same as regular Razorpay keys if RazorpayX is enabled
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_ACCOUNT_NUMBER = process.env.RAZORPAY_ACCOUNT_NUMBER || ''; // Your RazorpayX account number

// Base URL for RazorpayX API
const BASE_URL = 'https://api.razorpay.com/v1';

// Create axios instance with Basic Auth
const razorpayPayoutClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  auth: {
    username: RAZORPAY_KEY_ID,
    password: RAZORPAY_KEY_SECRET,
  },
});

// Types
export interface ContactDetails {
  name: string;
  email: string;
  contact: string;
  type: 'vendor' | 'customer' | 'employee' | 'self';
  reference_id?: string;
  notes?: Record<string, string>;
}

export interface FundAccountDetails {
  contact_id: string;
  account_type: 'bank_account' | 'vpa';
  bank_account?: {
    name: string;
    ifsc: string;
    account_number: string;
  };
  vpa?: {
    address: string; // UPI ID
  };
}

export interface PayoutRequest {
  account_number: string;
  fund_account_id: string;
  amount: number; // In paise (smallest currency unit)
  currency: string;
  mode: 'NEFT' | 'RTGS' | 'IMPS' | 'UPI';
  purpose: 'refund' | 'cashback' | 'payout' | 'salary' | 'utility bill' | 'vendor bill';
  queue_if_low_balance?: boolean;
  reference_id?: string;
  narration?: string;
  notes?: Record<string, string>;
}

export interface PayoutResponse {
  success: boolean;
  data?: any;
  message: string;
}

/**
 * Create a Contact in RazorpayX
 * Required before creating a fund account
 */
export const createContact = async (details: ContactDetails): Promise<PayoutResponse> => {
  try {
    const response = await razorpayPayoutClient.post('/contacts', {
      name: details.name,
      email: details.email,
      contact: details.contact,
      type: details.type,
      reference_id: details.reference_id,
      notes: details.notes || {},
    });

    return {
      success: true,
      data: response.data,
      message: 'Contact created successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Create Contact Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to create contact',
    };
  }
};

/**
 * Get Contact by ID
 */
export const getContact = async (contactId: string): Promise<PayoutResponse> => {
  try {
    const response = await razorpayPayoutClient.get(`/contacts/${contactId}`);
    return {
      success: true,
      data: response.data,
      message: 'Contact retrieved successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Get Contact Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to get contact',
    };
  }
};

/**
 * Create a Fund Account (Bank Account or VPA)
 * Links a bank account to a contact
 */
export const createFundAccount = async (details: FundAccountDetails): Promise<PayoutResponse> => {
  try {
    const payload: any = {
      contact_id: details.contact_id,
      account_type: details.account_type,
    };

    if (details.account_type === 'bank_account' && details.bank_account) {
      payload.bank_account = {
        name: details.bank_account.name,
        ifsc: details.bank_account.ifsc,
        account_number: details.bank_account.account_number,
      };
    } else if (details.account_type === 'vpa' && details.vpa) {
      payload.vpa = {
        address: details.vpa.address,
      };
    }

    const response = await razorpayPayoutClient.post('/fund_accounts', payload);

    return {
      success: true,
      data: response.data,
      message: 'Fund account created successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Create Fund Account Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to create fund account',
    };
  }
};

/**
 * Get Fund Account by ID
 */
export const getFundAccount = async (fundAccountId: string): Promise<PayoutResponse> => {
  try {
    const response = await razorpayPayoutClient.get(`/fund_accounts/${fundAccountId}`);
    return {
      success: true,
      data: response.data,
      message: 'Fund account retrieved successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Get Fund Account Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to get fund account',
    };
  }
};

/**
 * Validate Bank Account (Penny Drop)
 * Verifies account holder name and account status
 */
export const validateBankAccount = async (
  fundAccountId: string,
  amount: number = 100 // Default penny drop amount in paise (₹1)
): Promise<PayoutResponse> => {
  try {
    const response = await razorpayPayoutClient.post('/fund_accounts/validations', {
      account_number: RAZORPAY_ACCOUNT_NUMBER,
      fund_account: {
        id: fundAccountId,
      },
      amount,
      currency: 'INR',
      notes: {
        purpose: 'bank_account_validation',
      },
    });

    return {
      success: true,
      data: response.data,
      message: 'Bank account validation initiated',
    };
  } catch (error: any) {
    console.error('Razorpay Bank Validation Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to validate bank account',
    };
  }
};

/**
 * Create a Payout (Transfer money to vendor)
 */
export const createPayout = async (payout: PayoutRequest): Promise<PayoutResponse> => {
  try {
    const response = await razorpayPayoutClient.post('/payouts', {
      account_number: payout.account_number || RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: payout.fund_account_id,
      amount: payout.amount, // Already in paise
      currency: payout.currency || 'INR',
      mode: payout.mode || 'IMPS',
      purpose: payout.purpose || 'payout',
      queue_if_low_balance: payout.queue_if_low_balance ?? true,
      reference_id: payout.reference_id,
      narration: payout.narration,
      notes: payout.notes || {},
    });

    return {
      success: true,
      data: response.data,
      message: 'Payout created successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Create Payout Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to create payout',
    };
  }
};

/**
 * Get Payout by ID
 */
export const getPayout = async (payoutId: string): Promise<PayoutResponse> => {
  try {
    const response = await razorpayPayoutClient.get(`/payouts/${payoutId}`);
    return {
      success: true,
      data: response.data,
      message: 'Payout retrieved successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Get Payout Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to get payout',
    };
  }
};

/**
 * Cancel a Payout (only if status is 'queued')
 */
export const cancelPayout = async (payoutId: string): Promise<PayoutResponse> => {
  try {
    const response = await razorpayPayoutClient.post(`/payouts/${payoutId}/cancel`);
    return {
      success: true,
      data: response.data,
      message: 'Payout cancelled successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Cancel Payout Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to cancel payout',
    };
  }
};

/**
 * Verify webhook signature
 * Ensures webhook is genuinely from Razorpay
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

/**
 * Generate unique contact reference ID
 */
export const generateContactReferenceId = (userId: string): string => {
  return `VENDOR_${userId}`;
};

/**
 * Generate unique payout reference ID
 */
export const generatePayoutReferenceId = (withdrawalId: string): string => {
  return `WD_${withdrawalId}_${Date.now()}`;
};

/**
 * Check if RazorpayX Payouts is configured
 */
export const isPayoutsConfigured = (): boolean => {
  return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && RAZORPAY_ACCOUNT_NUMBER);
};

/**
 * Get RazorpayX Account Balance
 */
export const getAccountBalance = async (): Promise<PayoutResponse> => {
  try {
    const response = await razorpayPayoutClient.get(`/balance?account_number=${RAZORPAY_ACCOUNT_NUMBER}`);
    return {
      success: true,
      data: response.data,
      message: 'Balance retrieved successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Get Balance Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to get balance',
    };
  }
};

/**
 * Get Transfer Status by Payout ID
 * Maps to the existing interface expected by wallet controller
 */
export const getTransferStatus = async (payoutId: string): Promise<PayoutResponse> => {
  try {
    const response = await razorpayPayoutClient.get(`/payouts/${payoutId}`);
    
    // Map Razorpay status to expected format
    const status = response.data.status;
    let mappedStatus = 'PENDING';
    
    if (status === 'processed') {
      mappedStatus = 'SUCCESS';
    } else if (status === 'reversed' || status === 'failed' || status === 'cancelled') {
      mappedStatus = 'FAILED';
    } else if (status === 'processing' || status === 'queued') {
      mappedStatus = 'PENDING';
    }

    return {
      success: true,
      data: {
        transfer: {
          status: mappedStatus,
          razorpayStatus: status,
          utr: response.data.utr,
          reason: response.data.failure_reason,
          ...response.data,
        },
      },
      message: 'Transfer status retrieved successfully',
    };
  } catch (error: any) {
    console.error('Razorpay Get Transfer Status Error:', error.response?.data || error.message);
    return {
      success: false,
      data: error.response?.data,
      message: error.response?.data?.error?.description || 'Failed to get transfer status',
    };
  }
};

/**
 * Complete withdrawal flow using Razorpay Payouts
 * 1. Create/find contact
 * 2. Create fund account
 * 3. Create payout
 */
export const processWithdrawal = async (
  withdrawalId: string,
  userId: string,
  amount: number,
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  },
  userEmail: string,
  userPhone: string
): Promise<{
  success: boolean;
  transferId: string;
  beneId: string;
  gatewayResponse: any;
  message: string;
}> => {
  try {
    const contactReferenceId = generateContactReferenceId(userId);
    const payoutReferenceId = generatePayoutReferenceId(withdrawalId);

    // Step 1: Create Contact
    let contactId: string;
    const contactResponse = await createContact({
      name: bankDetails.accountHolderName,
      email: userEmail,
      contact: userPhone,
      type: 'vendor',
      reference_id: contactReferenceId,
      notes: {
        userId,
        withdrawalId,
      },
    });

    if (contactResponse.success) {
      contactId = contactResponse.data.id;
    } else {
      // Try to find existing contact by reference_id
      try {
        const existingContacts = await razorpayPayoutClient.get('/contacts', {
          params: { reference_id: contactReferenceId },
        });
        
        if (existingContacts.data.items && existingContacts.data.items.length > 0) {
          contactId = existingContacts.data.items[0].id;
        } else {
          throw new Error(contactResponse.message);
        }
      } catch (searchError: any) {
        throw new Error(contactResponse.message || 'Failed to create or find contact');
      }
    }

    // Step 2: Create Fund Account
    const fundAccountResponse = await createFundAccount({
      contact_id: contactId,
      account_type: 'bank_account',
      bank_account: {
        name: bankDetails.accountHolderName,
        ifsc: bankDetails.ifscCode,
        account_number: bankDetails.accountNumber,
      },
    });

    if (!fundAccountResponse.success) {
      throw new Error(fundAccountResponse.message || 'Failed to create fund account');
    }

    const fundAccountId = fundAccountResponse.data.id;

    // Step 3: Create Payout
    const amountInPaise = Math.round(amount * 100);
    const payoutResponse = await createPayout({
      account_number: RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: amountInPaise,
      currency: 'INR',
      mode: 'IMPS', // Use IMPS for instant transfer, or 'NEFT' for regular
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: payoutReferenceId,
      narration: `Withdrawal for ${withdrawalId}`,
      notes: {
        withdrawalId,
        userId,
        bankName: bankDetails.bankName,
      },
    });

    if (payoutResponse.success) {
      return {
        success: true,
        transferId: payoutResponse.data.id,
        beneId: fundAccountId,
        gatewayResponse: payoutResponse.data,
        message: 'Payout initiated successfully',
      };
    } else {
      throw new Error(payoutResponse.message || 'Payout request failed');
    }
  } catch (error: any) {
    console.error('Process Withdrawal Error:', error);
    return {
      success: false,
      transferId: '',
      beneId: '',
      gatewayResponse: error.response?.data || error.message,
      message: error.message || 'Failed to process withdrawal',
    };
  }
};

export default {
  createContact,
  getContact,
  createFundAccount,
  getFundAccount,
  validateBankAccount,
  createPayout,
  getPayout,
  cancelPayout,
  verifyWebhookSignature,
  generateContactReferenceId,
  generatePayoutReferenceId,
  isPayoutsConfigured,
  getAccountBalance,
  getTransferStatus,
  processWithdrawal,
};
