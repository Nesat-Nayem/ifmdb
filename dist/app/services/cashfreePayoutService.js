"use strict";
/**
 * Cashfree Payouts Service
 *
 * Handles automatic vendor withdrawals using Cashfree Payouts API
 * Documentation: https://docs.cashfree.com/reference/payouts-api-overview
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
exports.processWithdrawal = exports.isPayoutsConfigured = exports.generateTransferId = exports.generateBeneId = exports.verifyWebhookSignature = exports.getBalance = exports.getTransferStatus = exports.requestTransfer = exports.validateBankAccount = exports.getBeneficiary = exports.addBeneficiary = exports.getAuthToken = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
// Environment variables
const CASHFREE_PAYOUT_CLIENT_ID = process.env.CASHFREE_PAYOUT_CLIENT_ID || '';
const CASHFREE_PAYOUT_CLIENT_SECRET = process.env.CASHFREE_PAYOUT_CLIENT_SECRET || '';
const CASHFREE_PAYOUT_ENV = process.env.CASHFREE_PAYOUT_ENV || 'TEST'; // TEST or PROD
// Base URLs
const BASE_URLS = {
    TEST: 'https://payout-gamma.cashfree.com/payout/v1',
    PROD: 'https://payout-api.cashfree.com/payout/v1'
};
const BASE_URL = BASE_URLS[CASHFREE_PAYOUT_ENV] || BASE_URLS.TEST;
// Axios instance with auth headers
const cashfreePayoutClient = axios_1.default.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': CASHFREE_PAYOUT_CLIENT_ID,
        'X-Client-Secret': CASHFREE_PAYOUT_CLIENT_SECRET,
    },
});
/**
 * Get authentication token (if using token-based auth)
 * Note: Cashfree Payouts uses Client ID/Secret in headers, not token
 */
const getAuthToken = () => __awaiter(void 0, void 0, void 0, function* () {
    // Cashfree Payouts doesn't require separate token
    // Auth is done via X-Client-Id and X-Client-Secret headers
    return 'not_required';
});
exports.getAuthToken = getAuthToken;
/**
 * Add a beneficiary to Cashfree
 * Required before making any transfer
 */
const addBeneficiary = (details) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const response = yield cashfreePayoutClient.post('/addBeneficiary', {
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
    }
    catch (error) {
        console.error('Cashfree Add Beneficiary Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Failed to add beneficiary');
    }
});
exports.addBeneficiary = addBeneficiary;
/**
 * Get beneficiary details
 */
const getBeneficiary = (beneId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const response = yield cashfreePayoutClient.get(`/getBeneficiary/${beneId}`);
        return {
            status: response.data.status,
            subCode: response.data.subCode,
            message: response.data.message,
            data: response.data.data,
        };
    }
    catch (error) {
        console.error('Cashfree Get Beneficiary Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Failed to get beneficiary');
    }
});
exports.getBeneficiary = getBeneficiary;
/**
 * Validate bank account details (Penny Drop)
 * Verifies account holder name and account status
 */
const validateBankAccount = (details) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const response = yield cashfreePayoutClient.post('/validation/bankDetails', {
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
    }
    catch (error) {
        console.error('Cashfree Bank Validation Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Failed to validate bank account');
    }
});
exports.validateBankAccount = validateBankAccount;
/**
 * Request a transfer (payout)
 * This initiates the actual money transfer to beneficiary
 */
const requestTransfer = (transfer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const response = yield cashfreePayoutClient.post('/requestTransfer', {
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
    }
    catch (error) {
        console.error('Cashfree Request Transfer Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Failed to request transfer');
    }
});
exports.requestTransfer = requestTransfer;
/**
 * Get transfer status
 */
const getTransferStatus = (transferId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const response = yield cashfreePayoutClient.get(`/getTransferStatus`, {
            params: { transferId },
        });
        return {
            status: response.data.status,
            subCode: response.data.subCode,
            message: response.data.message,
            data: response.data.data,
        };
    }
    catch (error) {
        console.error('Cashfree Get Transfer Status Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Failed to get transfer status');
    }
});
exports.getTransferStatus = getTransferStatus;
/**
 * Get balance from Cashfree Payout account
 */
const getBalance = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const response = yield cashfreePayoutClient.get('/getBalance');
        return {
            status: response.data.status,
            subCode: response.data.subCode,
            message: response.data.message,
            data: response.data.data,
        };
    }
    catch (error) {
        console.error('Cashfree Get Balance Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Failed to get balance');
    }
});
exports.getBalance = getBalance;
/**
 * Verify webhook signature
 * Ensures webhook is genuinely from Cashfree
 */
const verifyWebhookSignature = (payload, signature, timestamp) => {
    try {
        // Cashfree webhook signature verification
        const signatureData = `${timestamp}${payload}`;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', CASHFREE_PAYOUT_CLIENT_SECRET)
            .update(signatureData)
            .digest('base64');
        return signature === expectedSignature;
    }
    catch (error) {
        console.error('Webhook signature verification error:', error);
        return false;
    }
};
exports.verifyWebhookSignature = verifyWebhookSignature;
/**
 * Generate unique beneficiary ID
 */
const generateBeneId = (userId) => {
    return `VENDOR_${userId}_${Date.now()}`;
};
exports.generateBeneId = generateBeneId;
/**
 * Generate unique transfer ID
 */
const generateTransferId = (withdrawalId) => {
    return `WD_${withdrawalId}_${Date.now()}`;
};
exports.generateTransferId = generateTransferId;
/**
 * Check if Cashfree Payouts is configured
 */
const isPayoutsConfigured = () => {
    return !!(CASHFREE_PAYOUT_CLIENT_ID && CASHFREE_PAYOUT_CLIENT_SECRET);
};
exports.isPayoutsConfigured = isPayoutsConfigured;
/**
 * Complete withdrawal flow
 * 1. Add/verify beneficiary
 * 2. Initiate transfer
 */
const processWithdrawal = (withdrawalId, userId, amount, bankDetails, userEmail, userPhone) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        // Generate IDs
        const beneId = (0, exports.generateBeneId)(userId);
        const transferId = (0, exports.generateTransferId)(withdrawalId);
        // Step 1: Add beneficiary (or use existing)
        let beneficiaryAdded = false;
        try {
            const beneResponse = yield (0, exports.addBeneficiary)({
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
        }
        catch (error) {
            // If beneficiary already exists, continue
            if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('already exists')) || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('duplicate'))) {
                beneficiaryAdded = true;
            }
            else {
                throw error;
            }
        }
        if (!beneficiaryAdded) {
            throw new Error('Failed to add beneficiary to Cashfree');
        }
        // Step 2: Request transfer
        const transferResponse = yield (0, exports.requestTransfer)({
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
        }
        else {
            throw new Error(transferResponse.message || 'Transfer request failed');
        }
    }
    catch (error) {
        console.error('Process Withdrawal Error:', error);
        return {
            success: false,
            transferId: '',
            beneId: '',
            gatewayResponse: ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message,
            message: error.message || 'Failed to process withdrawal',
        };
    }
});
exports.processWithdrawal = processWithdrawal;
exports.default = {
    addBeneficiary: exports.addBeneficiary,
    getBeneficiary: exports.getBeneficiary,
    validateBankAccount: exports.validateBankAccount,
    requestTransfer: exports.requestTransfer,
    getTransferStatus: exports.getTransferStatus,
    getBalance: exports.getBalance,
    verifyWebhookSignature: exports.verifyWebhookSignature,
    generateBeneId: exports.generateBeneId,
    generateTransferId: exports.generateTransferId,
    isPayoutsConfigured: exports.isPayoutsConfigured,
    processWithdrawal: exports.processWithdrawal,
};
