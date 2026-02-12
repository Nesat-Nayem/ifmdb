"use strict";
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
exports.generateVendorReferenceId = exports.isRouteConfigured = exports.verifyWebhookSignature = exports.reverseTransfer = exports.fetchTransfer = exports.fetchPaymentTransfers = exports.createTransferFromPayment = exports.buildTransferParams = exports.getSettlementHoldDays = exports.getSettlementHoldTimestamp = exports.updateProductConfiguration = exports.requestProductConfiguration = exports.createStakeholder = exports.deleteLinkedAccount = exports.fetchLinkedAccount = exports.submitAccount = exports.createLinkedAccount = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
// Environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
// Configurable settlement hold period (in days) - defaults to 7
const ROUTE_SETTLEMENT_HOLD_DAYS = parseInt(process.env.RAZORPAY_ROUTE_SETTLEMENT_HOLD_DAYS || '7', 10);
// Base URLs
const BASE_URL_V1 = 'https://api.razorpay.com/v1';
const BASE_URL_V2 = 'https://api.razorpay.com/v2';
// Axios clients with Basic Auth
const razorpayClientV1 = axios_1.default.create({
    baseURL: BASE_URL_V1,
    headers: { 'Content-Type': 'application/json' },
    auth: { username: RAZORPAY_KEY_ID, password: RAZORPAY_KEY_SECRET },
});
const razorpayClientV2 = axios_1.default.create({
    baseURL: BASE_URL_V2,
    headers: { 'Content-Type': 'application/json' },
    auth: { username: RAZORPAY_KEY_ID, password: RAZORPAY_KEY_SECRET },
});
// ==================== LINKED ACCOUNT OPERATIONS ====================
/**
 * Create a Linked Account for a vendor
 * POST /v2/accounts
 */
const createLinkedAccount = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    try {
        const payload = {
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
                vendorId: (_a = params.referenceId) === null || _a === void 0 ? void 0 : _a.replace('V_', ''),
            },
        };
        const response = yield razorpayClientV2.post('/accounts', payload);
        return {
            success: true,
            data: response.data,
            accountId: response.data.id,
            message: 'Linked account created successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Create Linked Account Error:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
        const errorDesc = (((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || '').toLowerCase();
        // Handle duplicate email - existing account may be suspended
        if (errorDesc.includes('already exists') ||
            errorDesc.includes('already been taken') ||
            errorDesc.includes('duplicate')) {
            // Retry with a modified email using +route suffix (works with most email providers)
            try {
                const [localPart, domain] = params.email.split('@');
                const modifiedEmail = `${localPart}+route${Date.now()}@${domain}`;
                console.log(`Retrying linked account creation with modified email: ${modifiedEmail}`);
                const retryPayload = {
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
                        vendorId: (_f = params.referenceId) === null || _f === void 0 ? void 0 : _f.replace('V_', ''),
                        retry: 'true'
                    },
                };
                const retryResponse = yield razorpayClientV2.post('/accounts', retryPayload);
                return {
                    success: true,
                    data: retryResponse.data,
                    accountId: retryResponse.data.id,
                    message: 'Linked account created with modified email (original email was in use)',
                };
            }
            catch (retryErr) {
                console.error('Retry with modified email also failed:', ((_g = retryErr.response) === null || _g === void 0 ? void 0 : _g.data) || retryErr.message);
                return {
                    success: false,
                    data: (_h = retryErr.response) === null || _h === void 0 ? void 0 : _h.data,
                    message: ((_l = (_k = (_j = retryErr.response) === null || _j === void 0 ? void 0 : _j.data) === null || _k === void 0 ? void 0 : _k.error) === null || _l === void 0 ? void 0 : _l.description) || 'Failed to create linked account (email conflict)',
                };
            }
        }
        return {
            success: false,
            data: (_m = error.response) === null || _m === void 0 ? void 0 : _m.data,
            message: ((_q = (_p = (_o = error.response) === null || _o === void 0 ? void 0 : _o.data) === null || _p === void 0 ? void 0 : _p.error) === null || _q === void 0 ? void 0 : _q.description) || 'Failed to create linked account',
        };
    }
});
exports.createLinkedAccount = createLinkedAccount;
/**
 * Submit Linked Account details for activation
 * POST /v2/accounts/:accountId/submit
 */
const submitAccount = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayClientV2.post(`/accounts/${accountId}/submit`);
        return {
            success: true,
            data: response.data,
            accountId: accountId,
            message: 'Account submitted for activation successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Submit Account Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to submit account for activation',
        };
    }
});
exports.submitAccount = submitAccount;
/**
 * Fetch a Linked Account by ID
 * GET /v2/accounts/:accountId
 */
const fetchLinkedAccount = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayClientV2.get(`/accounts/${accountId}`);
        return {
            success: true,
            data: response.data,
            accountId: response.data.id,
            message: 'Linked account fetched successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Fetch Linked Account Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to fetch linked account',
        };
    }
});
exports.fetchLinkedAccount = fetchLinkedAccount;
/**
 * Delete a Linked Account
 * DELETE /v2/accounts/:accountId
 */
const deleteLinkedAccount = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayClientV2.delete(`/accounts/${accountId}`);
        return {
            success: true,
            data: response.data,
            accountId: accountId,
            message: 'Linked account deleted successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Delete Linked Account Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to delete linked account',
        };
    }
});
exports.deleteLinkedAccount = deleteLinkedAccount;
/**
 * Create a Stakeholder for a Linked Account
 * POST /v2/accounts/:accountId/stakeholders
 * Required step before product configuration can be activated
 */
const createStakeholder = (accountId, params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const payload = {
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
        }
        else {
            payload.dob = '1990-01-01'; // Default dummy DOB
        }
        if (params.phone) {
            payload.phone = {
                primary: params.phone,
            };
        }
        const response = yield razorpayClientV2.post(`/accounts/${accountId}/stakeholders`, payload);
        return {
            success: true,
            data: response.data,
            accountId: accountId,
            message: 'Stakeholder created successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Create Stakeholder Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to create stakeholder',
        };
    }
});
exports.createStakeholder = createStakeholder;
/**
 * Request Product Configuration for a Linked Account (to enable Route)
 * POST /v2/accounts/:accountId/products
 * Only pass product_name and tnc_accepted. Bank details go in the UPDATE step.
 */
const requestProductConfiguration = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const payload = {
            product_name: 'route',
            tnc_accepted: true,
        };
        const response = yield razorpayClientV2.post(`/accounts/${accountId}/products`, payload);
        return {
            success: true,
            data: response.data,
            accountId: accountId,
            message: 'Product configuration requested successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Product Config Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to configure product',
        };
    }
});
exports.requestProductConfiguration = requestProductConfiguration;
/**
 * Update Product Configuration (provide bank details for settlement)
 * PATCH /v2/accounts/:accountId/products/:productId
 * Bank details (settlements) go at top level per Razorpay docs
 */
const updateProductConfiguration = (accountId, productId, bankAccount) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const payload = {
            settlements: {
                account_number: bankAccount.accountNumber,
                ifsc_code: bankAccount.ifscCode,
                beneficiary_name: bankAccount.beneficiaryName,
            },
            tnc_accepted: true,
        };
        const response = yield razorpayClientV2.patch(`/accounts/${accountId}/products/${productId}`, payload);
        return {
            success: true,
            data: response.data,
            accountId: accountId,
            message: 'Product configuration updated successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Update Product Config Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to update product configuration',
        };
    }
});
exports.updateProductConfiguration = updateProductConfiguration;
// ==================== TRANSFER OPERATIONS ====================
/**
 * Get the settlement hold timestamp based on configurable days
 */
const getSettlementHoldTimestamp = () => {
    const holdMs = ROUTE_SETTLEMENT_HOLD_DAYS * 24 * 60 * 60 * 1000;
    return Math.floor((Date.now() + holdMs) / 1000);
};
exports.getSettlementHoldTimestamp = getSettlementHoldTimestamp;
/**
 * Get configured settlement hold days
 */
const getSettlementHoldDays = () => {
    return ROUTE_SETTLEMENT_HOLD_DAYS;
};
exports.getSettlementHoldDays = getSettlementHoldDays;
/**
 * Build transfer params for an order
 * Calculates vendor share after platform fee and applies settlement hold
 */
const buildTransferParams = (linkedAccountId, vendorAmountInPaise, notes) => {
    const holdTimestamp = (0, exports.getSettlementHoldTimestamp)();
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
exports.buildTransferParams = buildTransferParams;
/**
 * Create a transfer from a captured payment
 * POST /v1/payments/:paymentId/transfers
 *
 * Used as fallback when transfers weren't included in the order
 */
const createTransferFromPayment = (paymentId, transfers) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const payload = {
            transfers: transfers.map(t => {
                var _a;
                return ({
                    account: t.account,
                    amount: t.amount,
                    currency: t.currency || 'INR',
                    notes: t.notes || {},
                    linked_account_notes: t.linkedAccountNotes || [],
                    on_hold: (_a = t.onHold) !== null && _a !== void 0 ? _a : true,
                    on_hold_until: t.onHoldUntil,
                });
            }),
        };
        const response = yield razorpayClientV1.post(`/payments/${paymentId}/transfers`, payload);
        return {
            success: true,
            data: response.data,
            message: 'Transfer created successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Create Transfer Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to create transfer',
        };
    }
});
exports.createTransferFromPayment = createTransferFromPayment;
/**
 * Fetch transfers for a payment
 * GET /v1/payments/:paymentId/transfers
 */
const fetchPaymentTransfers = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayClientV1.get(`/payments/${paymentId}/transfers`);
        return {
            success: true,
            data: response.data,
            message: 'Transfers fetched successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Fetch Transfers Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to fetch transfers',
        };
    }
});
exports.fetchPaymentTransfers = fetchPaymentTransfers;
/**
 * Fetch a specific transfer
 * GET /v1/transfers/:transferId
 */
const fetchTransfer = (transferId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const response = yield razorpayClientV1.get(`/transfers/${transferId}`);
        return {
            success: true,
            data: response.data,
            message: 'Transfer fetched successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Fetch Transfer Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to fetch transfer',
        };
    }
});
exports.fetchTransfer = fetchTransfer;
/**
 * Reverse a transfer (for refunds)
 * POST /v1/transfers/:transferId/reversals
 */
const reverseTransfer = (transferId, amount, // In paise, if partial reversal
notes) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const payload = { notes: notes || {} };
        if (amount)
            payload.amount = amount;
        const response = yield razorpayClientV1.post(`/transfers/${transferId}/reversals`, payload);
        return {
            success: true,
            data: response.data,
            message: 'Transfer reversed successfully',
        };
    }
    catch (error) {
        console.error('Razorpay Reverse Transfer Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            data: (_b = error.response) === null || _b === void 0 ? void 0 : _b.data,
            message: ((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.description) || 'Failed to reverse transfer',
        };
    }
});
exports.reverseTransfer = reverseTransfer;
// ==================== WEBHOOK VERIFICATION ====================
/**
 * Verify Route webhook signature
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
// ==================== UTILITY ====================
/**
 * Check if Route is configured
 */
const isRouteConfigured = () => {
    return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
};
exports.isRouteConfigured = isRouteConfigured;
/**
 * Generate a unique reference ID for a vendor linked account
 */
const generateVendorReferenceId = (vendorId) => {
    // Razorpay reference_id max 20 chars. Use V_ prefix + last 18 chars of vendorId
    const shortId = vendorId.slice(-18);
    return `V_${shortId}`;
};
exports.generateVendorReferenceId = generateVendorReferenceId;
exports.default = {
    // Linked Accounts
    createLinkedAccount: exports.createLinkedAccount,
    fetchLinkedAccount: exports.fetchLinkedAccount,
    deleteLinkedAccount: exports.deleteLinkedAccount,
    submitAccount: exports.submitAccount,
    createStakeholder: exports.createStakeholder,
    requestProductConfiguration: exports.requestProductConfiguration,
    updateProductConfiguration: exports.updateProductConfiguration,
    // Transfers
    getSettlementHoldTimestamp: exports.getSettlementHoldTimestamp,
    getSettlementHoldDays: exports.getSettlementHoldDays,
    buildTransferParams: exports.buildTransferParams,
    createTransferFromPayment: exports.createTransferFromPayment,
    fetchPaymentTransfers: exports.fetchPaymentTransfers,
    fetchTransfer: exports.fetchTransfer,
    reverseTransfer: exports.reverseTransfer,
    // Webhook
    verifyWebhookSignature: exports.verifyWebhookSignature,
    // Utility
    isRouteConfigured: exports.isRouteConfigured,
    generateVendorReferenceId: exports.generateVendorReferenceId,
};
