/**
 * Cashfree Payouts Service
 * 
 * Handles automatic vendor withdrawals using Cashfree Payouts API
 * Documentation: https://docs.cashfree.com/reference/payouts-api-overview
 */

import axios from 'axios';
import crypto from 'crypto';

// Environment variables
const CASHFREE_PAYOUT_CLIENT_ID = process.env.CASHFREE_PAYOUT_CLIENT_ID || '';
const CASHFREE_PAYOUT_CLIENT_SECRET = process.env.CASHFREE_PAYOUT_CLIENT_SECRET || '';
const CASHFREE_PAYOUT_ENV = process.env.CASHFREE_PAYOUT_ENV || 'TEST'; // TEST or PROD

// Base URLs
const BASE_URLS = {
  TEST: 'https://payout-gamma.cashfree.com/payout/v1',
  PROD: 'https://payout-api.cashfree.com/payout/v1'
};

const BASE_URL = BASE_URLS[CASHFREE_PAYOUT_ENV as keyof typeof BASE_URLS] || BASE_URLS.TEST;

// Axios instance with auth headers
const cashfreePayoutClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Id': CASHFREE_PAYOUT_CLIENT_ID,
    'X-Client-Secret': CASHFREE_PAYOUT_CLIENT_SECRET,
  },
});

// Types
export interface BeneficiaryDetails {
  beneId: string;
  name: string;
  email: string;
  phone: string;
  bankAccount: string;
  ifsc: string;
  address1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface TransferRequest {
  beneId: string;
  amount: number;
  transferId: string;
  transferMode?: 'banktransfer' | 'upi' | 'amazonpay' | 'paytm';
  remarks?: string;
}

export interface BankValidationRequest {
  name: string;
  phone: string;
  bankAccount: string;
  ifsc: string;
}

export interface PayoutResponse {
  status: string;
  subCode: string;
  message: string;
  data?: any;
}

/**
 * Get authentication token (if using token-based auth)
 * Note: Cashfree Payouts uses Client ID/Secret in headers, not token
 */
export const getAuthToken = async (): Promise<string> => {
  // Cashfree Payouts doesn't require separate token
  // Auth is done via X-Client-Id and X-Client-Secret headers
  return 'not_required';
};

/**
 * Add a beneficiary to Cashfree
 * Required before making any transfer
 */
export const addBeneficiary = async (details: BeneficiaryDetails): Promise<PayoutResponse> => {
  try {
    const response = await cashfreePayoutClient.post('/addBeneficiary', {
      beneId: details.beneId,
      name: details.name,
      email: details.email,
      phone: details.phone,
      bankAccount: details.bankAccount,
      ifsc: details.ifsc,
      address1: details.address1 || 'NA',
      city: details.city || 'NA',
      state: details.state || 'NA',
      pincode: details.pincode || '000000',
    });

    return {
      status: response.data.status,
      subCode: response.data.subCode,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Cashfree Add Beneficiary Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to add beneficiary');
  }
};

/**
 * Get beneficiary details
 */
export const getBeneficiary = async (beneId: string): Promise<PayoutResponse> => {
  try {
    const response = await cashfreePayoutClient.get(`/getBeneficiary/${beneId}`);
    return {
      status: response.data.status,
      subCode: response.data.subCode,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Cashfree Get Beneficiary Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get beneficiary');
  }
};

/**
 * Validate bank account details (Penny Drop)
 * Verifies account holder name and account status
 */
export const validateBankAccount = async (details: BankValidationRequest): Promise<PayoutResponse> => {
  try {
    const response = await cashfreePayoutClient.post('/validation/bankDetails', {
      name: details.name,
      phone: details.phone,
      bankAccount: details.bankAccount,
      ifsc: details.ifsc,
    });

    return {
      status: response.data.status,
      subCode: response.data.subCode,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Cashfree Bank Validation Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to validate bank account');
  }
};

/**
 * Request a transfer (payout)
 * This initiates the actual money transfer to beneficiary
 */
export const requestTransfer = async (transfer: TransferRequest): Promise<PayoutResponse> => {
  try {
    const response = await cashfreePayoutClient.post('/requestTransfer', {
      beneId: transfer.beneId,
      amount: transfer.amount.toString(),
      transferId: transfer.transferId,
      transferMode: transfer.transferMode || 'banktransfer',
      remarks: transfer.remarks || 'Vendor withdrawal',
    });

    return {
      status: response.data.status,
      subCode: response.data.subCode,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Cashfree Request Transfer Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to request transfer');
  }
};

/**
 * Get transfer status
 */
export const getTransferStatus = async (transferId: string): Promise<PayoutResponse> => {
  try {
    const response = await cashfreePayoutClient.get(`/getTransferStatus`, {
      params: { transferId },
    });

    return {
      status: response.data.status,
      subCode: response.data.subCode,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Cashfree Get Transfer Status Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get transfer status');
  }
};

/**
 * Get balance from Cashfree Payout account
 */
export const getBalance = async (): Promise<PayoutResponse> => {
  try {
    const response = await cashfreePayoutClient.get('/getBalance');

    return {
      status: response.data.status,
      subCode: response.data.subCode,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Cashfree Get Balance Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get balance');
  }
};

/**
 * Verify webhook signature
 * Ensures webhook is genuinely from Cashfree
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  timestamp: string
): boolean => {
  try {
    // Cashfree webhook signature verification
    const signatureData = `${timestamp}${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', CASHFREE_PAYOUT_CLIENT_SECRET)
      .update(signatureData)
      .digest('base64');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

/**
 * Generate unique beneficiary ID
 */
export const generateBeneId = (userId: string): string => {
  return `VENDOR_${userId}_${Date.now()}`;
};

/**
 * Generate unique transfer ID
 */
export const generateTransferId = (withdrawalId: string): string => {
  return `WD_${withdrawalId}_${Date.now()}`;
};

/**
 * Check if Cashfree Payouts is configured
 */
export const isPayoutsConfigured = (): boolean => {
  return !!(CASHFREE_PAYOUT_CLIENT_ID && CASHFREE_PAYOUT_CLIENT_SECRET);
};

/**
 * Complete withdrawal flow
 * 1. Add/verify beneficiary
 * 2. Initiate transfer
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
    // Generate IDs
    const beneId = generateBeneId(userId);
    const transferId = generateTransferId(withdrawalId);

    // Step 1: Add beneficiary (or use existing)
    let beneficiaryAdded = false;
    try {
      const beneResponse = await addBeneficiary({
        beneId,
        name: bankDetails.accountHolderName,
        email: userEmail,
        phone: userPhone,
        bankAccount: bankDetails.accountNumber,
        ifsc: bankDetails.ifscCode,
      });

      if (beneResponse.status === 'SUCCESS') {
        beneficiaryAdded = true;
      }
    } catch (error: any) {
      // If beneficiary already exists, continue
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        beneficiaryAdded = true;
      } else {
        throw error;
      }
    }

    if (!beneficiaryAdded) {
      throw new Error('Failed to add beneficiary to Cashfree');
    }

    // Step 2: Request transfer
    const transferResponse = await requestTransfer({
      beneId,
      amount,
      transferId,
      transferMode: 'banktransfer',
      remarks: `Withdrawal for order ${withdrawalId}`,
    });

    if (transferResponse.status === 'SUCCESS') {
      return {
        success: true,
        transferId,
        beneId,
        gatewayResponse: transferResponse.data,
        message: 'Transfer initiated successfully',
      };
    } else {
      throw new Error(transferResponse.message || 'Transfer request failed');
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
  addBeneficiary,
  getBeneficiary,
  validateBankAccount,
  requestTransfer,
  getTransferStatus,
  getBalance,
  verifyWebhookSignature,
  generateBeneId,
  generateTransferId,
  isPayoutsConfigured,
  processWithdrawal,
};
