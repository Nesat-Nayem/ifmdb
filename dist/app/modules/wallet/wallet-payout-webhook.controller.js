"use strict";
/**
 * Razorpay Route Webhook Handler
 *
 * Handles webhook notifications from Razorpay Route (split payments)
 * Updates transfer/settlement status for vendor payouts
 *
 * Replaces the old RazorpayX Payout webhook handler.
 *
 * Webhook events handled:
 * - transfer.processed: Route transfer completed
 * - transfer.settled: Transfer settled to vendor's bank
 * - transfer.failed: Route transfer failed
 * - payment.captured: Payment captured (Route transfers auto-created)
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
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const wallet_model_1 = require("./wallet.model");
const razorpayRouteService_1 = __importDefault(require("../../services/razorpayRouteService"));
/**
 * Handle Razorpay Route Webhook
 */
const handleRouteWebhook = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const signature = req.headers['x-razorpay-signature'];
    const payload = JSON.stringify(req.body);
    // Verify webhook signature
    const isValid = razorpayRouteService_1.default.verifyWebhookSignature(payload, signature);
    if (!isValid) {
        console.error('Invalid Route webhook signature');
        return res.status(401).json({ message: 'Invalid signature' });
    }
    const { event, payload: webhookPayload } = req.body;
    console.log('Razorpay Route Webhook Received:', event);
    try {
        switch (event) {
            case 'transfer.processed': {
                // Transfer to linked account was processed
                const transfer = (_a = webhookPayload === null || webhookPayload === void 0 ? void 0 : webhookPayload.transfer) === null || _a === void 0 ? void 0 : _a.entity;
                if (transfer) {
                    const transferId = transfer.id;
                    const recipientAccountId = transfer.recipient;
                    // Find wallet transaction by Route transfer ID
                    const walletTransaction = yield wallet_model_1.WalletTransaction.findOne({
                        razorpayTransferId: transferId,
                    });
                    if (walletTransaction) {
                        console.log(`Route transfer ${transferId} processed for wallet transaction ${walletTransaction._id}`);
                    }
                    // Find wallet by linked account ID and log
                    const wallet = yield wallet_model_1.Wallet.findOne({ razorpayLinkedAccountId: recipientAccountId });
                    if (wallet) {
                        console.log(`Route transfer ${transferId} processed for vendor wallet ${wallet._id}`);
                    }
                }
                break;
            }
            case 'transfer.settled': {
                // Transfer settled to vendor's bank account
                const transfer = (_b = webhookPayload === null || webhookPayload === void 0 ? void 0 : webhookPayload.transfer) === null || _b === void 0 ? void 0 : _b.entity;
                if (transfer) {
                    const transferId = transfer.id;
                    const recipientAccountId = transfer.recipient;
                    const settlementId = transfer.recipient_settlement_id;
                    // Find wallet transaction and update
                    const walletTransaction = yield wallet_model_1.WalletTransaction.findOne({
                        razorpayTransferId: transferId,
                    });
                    if (walletTransaction) {
                        // Move from pending to available in vendor wallet
                        const wallet = yield wallet_model_1.Wallet.findById(walletTransaction.walletId);
                        if (wallet) {
                            const amount = walletTransaction.netAmount;
                            wallet.pendingBalance = Math.max(0, wallet.pendingBalance - amount);
                            wallet.balance += amount;
                            yield wallet.save();
                            console.log(`Route transfer ${transferId} settled. Vendor wallet ${wallet._id} updated: +₹${amount} available`);
                        }
                    }
                    // Also try finding by linked account
                    if (!walletTransaction) {
                        const wallet = yield wallet_model_1.Wallet.findOne({ razorpayLinkedAccountId: recipientAccountId });
                        if (wallet) {
                            console.log(`Route transfer ${transferId} settled for linked account ${recipientAccountId}, settlement: ${settlementId}`);
                        }
                    }
                }
                break;
            }
            case 'transfer.failed': {
                // Transfer failed
                const transfer = (_c = webhookPayload === null || webhookPayload === void 0 ? void 0 : webhookPayload.transfer) === null || _c === void 0 ? void 0 : _c.entity;
                if (transfer) {
                    const transferId = transfer.id;
                    const errorDesc = ((_d = transfer.error) === null || _d === void 0 ? void 0 : _d.description) || 'Transfer failed';
                    // Find wallet transaction and revert
                    const walletTransaction = yield wallet_model_1.WalletTransaction.findOne({
                        razorpayTransferId: transferId,
                    });
                    if (walletTransaction) {
                        walletTransaction.status = 'failed';
                        yield walletTransaction.save();
                        // Revert pending balance
                        const wallet = yield wallet_model_1.Wallet.findById(walletTransaction.walletId);
                        if (wallet) {
                            wallet.pendingBalance = Math.max(0, wallet.pendingBalance - walletTransaction.netAmount);
                            wallet.totalEarnings = Math.max(0, wallet.totalEarnings - walletTransaction.netAmount);
                            yield wallet.save();
                            console.error(`Route transfer ${transferId} failed: ${errorDesc}. Reverted ₹${walletTransaction.netAmount} from vendor wallet ${wallet._id}`);
                        }
                    }
                }
                break;
            }
            default:
                console.log('Unhandled Route webhook event:', event);
        }
        // Always return 200 to Razorpay
        return res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Route webhook processing error:', error);
        // Return 200 to prevent retries
        return res.status(200).json({ received: true });
    }
}));
/**
 * Manual sync Route transfer status
 * Admin can check transfer status from Razorpay
 */
const syncTransferStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { transferId } = req.params;
    if (!transferId) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Transfer ID is required',
            data: null,
        });
    }
    try {
        const result = yield razorpayRouteService_1.default.fetchTransfer(transferId);
        if (result.success) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Transfer status fetched successfully',
                data: result.data,
            });
        }
        else {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: result.message,
                data: null,
            });
        }
    }
    catch (error) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message || 'Failed to fetch transfer status',
            data: null,
        });
    }
}));
exports.default = {
    handleRouteWebhook,
    syncTransferStatus,
};
