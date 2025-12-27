"use strict";
/**
 * Razorpay Payouts Service (RazorpayX)
 *
 * Handles automatic vendor withdrawals using Razorpay Payouts API
 * Documentation: https://razorpay.com/docs/api/x/payouts/
 *
 * Note: RazorpayX requires separate API keys from regular Razorpay payments
 * You can use the same keys if RazorpayX is enabled on your account
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
exports.processWithdrawal = exports.getTransferStatus = exports.getAccountBalance = exports.isPayoutsConfigured = exports.generatePayoutReferenceId = exports.generateContactReferenceId = exports.verifyWebhookSignature = exports.cancelPayout = exports.getPayout = exports.createPayout = exports.validateBankAccount = exports.getFundAccount = exports.createFundAccount = exports.getContact = exports.createContact = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
// Environment variables for RazorpayX Payouts
// Can be same as regular Razorpay keys if RazorpayX is enabled
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_ACCOUNT_NUMBER = process.env.RAZORPAY_ACCOUNT_NUMBER || ''; // Your RazorpayX account number
// Base URL for RazorpayX API
const BASE_URL = 'https://api.razorpay.com/v1';
// Create axios instance with Basic Auth
const razorpayPayoutClient = axios_1.default.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    auth: {
        username: RAZORPAY_KEY_ID,
        password: RAZORPAY_KEY_SECRET,
    },
});
/**
 * Create a Contact in RazorpayX
 * Required before creating a fund account
 */
const createContact = (details) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayPayoutClient.post('/contacts', {
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
    }
    catch (error) {
        console.error('Razorpay Create Contact Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to create contact',
        };
    }
});
exports.createContact = createContact;
/**
 * Get Contact by ID
 */
const getContact = (contactId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayPayoutClient.get(`/contacts/${contactId}`);
        return {
            success: true,
            data: response.data,
            message: 'Contact retrieved successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Get Contact Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to get contact',
        };
    }
});
exports.getContact = getContact;
/**
 * Create a Fund Account (Bank Account or VPA)
 * Links a bank account to a contact
 */
const createFundAccount = (details) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const payload = {
            contact_id: details.contact_id,
            account_type: details.account_type,
        };
        if (details.account_type === 'bank_account' && details.bank_account) {
            payload.bank_account = {
                name: details.bank_account.name,
                ifsc: details.bank_account.ifsc,
                account_number: details.bank_account.account_number,
            };
        }
        else if (details.account_type === 'vpa' && details.vpa) {
            payload.vpa = {
                address: details.vpa.address,
            };
        }
        const response = yield razorpayPayoutClient.post('/fund_accounts', payload);
        return {
            success: true,
            data: response.data,
            message: 'Fund account created successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Create Fund Account Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to create fund account',
        };
    }
});
exports.createFundAccount = createFundAccount;
/**
 * Get Fund Account by ID
 */
const getFundAccount = (fundAccountId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayPayoutClient.get(`/fund_accounts/${fundAccountId}`);
        return {
            success: true,
            data: response.data,
            message: 'Fund account retrieved successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Get Fund Account Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to get fund account',
        };
    }
});
exports.getFundAccount = getFundAccount;
/**
 * Validate Bank Account (Penny Drop)
 * Verifies account holder name and account status
 */
const validateBankAccount = (fundAccountId_1, ...args_1) => __awaiter(void 0, [fundAccountId_1, ...args_1], void 0, function* (fundAccountId, amount = 100 // Default penny drop amount in paise (₹1)
) {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayPayoutClient.post('/fund_accounts/validations', {
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
    }
    catch (error) {
        console.error('Razorpay Bank Validation Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to validate bank account',
        };
    }
});
exports.validateBankAccount = validateBankAccount;
/**
 * Create a Payout (Transfer money to vendor)
 */
const createPayout = (payout) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const response = yield razorpayPayoutClient.post('/payouts', {
            account_number: payout.account_number || RAZORPAY_ACCOUNT_NUMBER,
            fund_account_id: payout.fund_account_id,
            amount: payout.amount, // Already in paise
            currency: payout.currency || 'INR',
            mode: payout.mode || 'IMPS',
            purpose: payout.purpose || 'payout',
            queue_if_low_balance: (_a = payout.queue_if_low_balance) !== null && _a !== void 0 ? _a : true,
            reference_id: payout.reference_id,
            narration: payout.narration,
            notes: payout.notes || {},
        });
        return {
            success: true,
            data: response.data,
            message: 'Payout created successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Create Payout Error:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
        return {
            success: false,
            data: (_c = error.response) === null || _c === void 0 ? void 0 : _c.data,
            message: ((_f = (_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.error) === null || _f === void 0 ? void 0 : _f.description) || 'Failed to create payout',
        };
    }
});
exports.createPayout = createPayout;
/**
 * Get Payout by ID
 */
const getPayout = (payoutId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayPayoutClient.get(`/payouts/${payoutId}`);
        return {
            success: true,
            data: response.data,
            message: 'Payout retrieved successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Get Payout Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to get payout',
        };
    }
});
exports.getPayout = getPayout;
/**
 * Cancel a Payout (only if status is 'queued')
 */
const cancelPayout = (payoutId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayPayoutClient.post(`/payouts/${payoutId}/cancel`);
        return {
            success: true,
            data: response.data,
            message: 'Payout cancelled successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Cancel Payout Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to cancel payout',
        };
    }
});
exports.cancelPayout = cancelPayout;
/**
 * Verify webhook signature
 * Ensures webhook is genuinely from Razorpay
 */
const verifyWebhookSignature = (payload, signature, webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET) => {
    try {
        const expectedSignature = crypto_1.default
            .createHmac('sha256', webhookSecret)
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
 * Generate unique contact reference ID
 */
const generateContactReferenceId = (userId) => {
    return `VENDOR_${userId}`;
};
exports.generateContactReferenceId = generateContactReferenceId;
/**
 * Generate unique payout reference ID
 */
const generatePayoutReferenceId = (withdrawalId) => {
    return `WD_${withdrawalId}_${Date.now()}`;
};
exports.generatePayoutReferenceId = generatePayoutReferenceId;
/**
 * Check if RazorpayX Payouts is configured
 */
const isPayoutsConfigured = () => {
    return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && RAZORPAY_ACCOUNT_NUMBER);
};
exports.isPayoutsConfigured = isPayoutsConfigured;
/**
 * Get RazorpayX Account Balance
 */
const getAccountBalance = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayPayoutClient.get(`/balance?account_number=${RAZORPAY_ACCOUNT_NUMBER}`);
        return {
            success: true,
            data: response.data,
            message: 'Balance retrieved successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Get Balance Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to get balance',
        };
    }
});
exports.getAccountBalance = getAccountBalance;
/**
 * Get Transfer Status by Payout ID
 * Maps to the existing interface expected by wallet controller
 */
const getTransferStatus = (payoutId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayPayoutClient.get(`/payouts/${payoutId}`);
        // Map Razorpay status to expected format
        const status = response.data.status;
        let mappedStatus = 'PENDING';
        if (status === 'processed') {
            mappedStatus = 'SUCCESS';
        }
        else if (status === 'reversed' || status === 'failed' || status === 'cancelled') {
            mappedStatus = 'FAILED';
        }
        else if (status === 'processing' || status === 'queued') {
            mappedStatus = 'PENDING';
        }
        return {
            success: true,
            data: {
                transfer: Object.assign({ status: mappedStatus, razorpayStatus: status, utr: response.data.utr, reason: response.data.failure_reason }, response.data),
            },
            message: 'Transfer status retrieved successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Get Transfer Status Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to get transfer status',
        };
    }
});
exports.getTransferStatus = getTransferStatus;
/**
 * Complete withdrawal flow using Razorpay Payouts
 * 1. Create/find contact
 * 2. Create fund account
 * 3. Create payout
 */
const processWithdrawal = (withdrawalId, userId, amount, bankDetails, userEmail, userPhone) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const contactReferenceId = (0, exports.generateContactReferenceId)(userId);
        const payoutReferenceId = (0, exports.generatePayoutReferenceId)(withdrawalId);
        // Step 1: Create Contact
        let contactId;
        const contactResponse = yield (0, exports.createContact)({
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
        }
        else {
            // Try to find existing contact by reference_id
            try {
                const existingContacts = yield razorpayPayoutClient.get('/contacts', {
                    params: { reference_id: contactReferenceId },
                });
                if (existingContacts.data.items && existingContacts.data.items.length > 0) {
                    contactId = existingContacts.data.items[0].id;
                }
                else {
                    throw new Error(contactResponse.message);
                }
            }
            catch (searchError) {
                throw new Error(contactResponse.message || 'Failed to create or find contact');
            }
        }
        // Step 2: Create Fund Account
        const fundAccountResponse = yield (0, exports.createFundAccount)({
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
        const payoutResponse = yield (0, exports.createPayout)({
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
        }
        else {
            throw new Error(payoutResponse.message || 'Payout request failed');
        }
    }
    catch (error) {
        console.error('Process Withdrawal Error:', error);
        return {
            success: false,
            transferId: '',
            beneId: '',
            gatewayResponse: ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message,
            message: error.message || 'Failed to process withdrawal',
        };
    }
});
exports.processWithdrawal = processWithdrawal;
exports.default = {
    createContact: exports.createContact,
    getContact: exports.getContact,
    createFundAccount: exports.createFundAccount,
    getFundAccount: exports.getFundAccount,
    validateBankAccount: exports.validateBankAccount,
    createPayout: exports.createPayout,
    getPayout: exports.getPayout,
    cancelPayout: exports.cancelPayout,
    verifyWebhookSignature: exports.verifyWebhookSignature,
    generateContactReferenceId: exports.generateContactReferenceId,
    generatePayoutReferenceId: exports.generatePayoutReferenceId,
    isPayoutsConfigured: exports.isPayoutsConfigured,
    getAccountBalance: exports.getAccountBalance,
    getTransferStatus: exports.getTransferStatus,
    processWithdrawal: exports.processWithdrawal,
};
