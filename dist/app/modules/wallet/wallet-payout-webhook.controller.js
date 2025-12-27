"use strict";
/**
 * Razorpay Payout Webhook Handler
 *
 * Handles webhook notifications from Razorpay Payouts (RazorpayX)
 * Updates withdrawal status automatically when transfer completes
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
const razorpayPayoutService_1 = __importDefault(require("../../services/razorpayPayoutService"));
/**
 * Handle Razorpay Payout Webhook
 *
 * Webhook events:
 * - payout.processed: Payout completed successfully
 * - payout.failed: Payout failed
 * - payout.reversed: Payout was reversed
 * - payout.queued: Payout is queued
 * - payout.pending: Payout is pending
 */
const handlePayoutWebhook = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const signature = req.headers['x-razorpay-signature'];
    const payload = JSON.stringify(req.body);
    // Verify webhook signature
    const isValid = razorpayPayoutService_1.default.verifyWebhookSignature(payload, signature);
    if (!isValid) {
        console.error('Invalid webhook signature');
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'Invalid signature',
            data: null,
        });
    }
    const { event, payload: webhookPayload } = req.body;
    const data = (_a = webhookPayload === null || webhookPayload === void 0 ? void 0 : webhookPayload.payout) === null || _a === void 0 ? void 0 : _a.entity;
    console.log('Razorpay Payout Webhook Received:', event, data);
    try {
        if (!data) {
            console.log('No payout data in webhook');
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Webhook received but no payout data',
                data: null,
            });
        }
        const payoutId = data.id;
        const utr = data.utr;
        const failureReason = data.failure_reason;
        // Find withdrawal request by gateway transaction ID (payout ID)
        const withdrawal = yield wallet_model_1.WithdrawalRequest.findOne({
            gatewayTransactionId: payoutId,
        });
        if (!withdrawal) {
            console.error('Withdrawal not found for payoutId:', payoutId);
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Webhook received but withdrawal not found',
                data: null,
            });
        }
        const wallet = yield wallet_model_1.Wallet.findById(withdrawal.walletId);
        const transaction = yield wallet_model_1.WalletTransaction.findOne({
            referenceType: 'withdrawal',
            referenceId: withdrawal._id,
        });
        if (!wallet) {
            console.error('Wallet not found for withdrawal:', withdrawal._id);
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Webhook received but wallet not found',
                data: null,
            });
        }
        // Handle different Razorpay webhook events
        switch (event) {
            case 'payout.processed':
                // Payout completed successfully
                withdrawal.status = 'completed';
                withdrawal.processedAt = new Date();
                withdrawal.gatewayResponse = Object.assign(Object.assign({}, withdrawal.gatewayResponse), { utr, completedAt: new Date(), razorpayStatus: data.status });
                yield withdrawal.save();
                // Update transaction
                if (transaction) {
                    transaction.status = 'completed';
                    yield transaction.save();
                }
                // Update wallet stats
                wallet.totalWithdrawn += withdrawal.amount;
                yield wallet.save();
                console.log(`Withdrawal ${withdrawal._id} completed successfully`);
                break;
            case 'payout.failed':
            case 'payout.reversed':
                // Payout failed or reversed - refund to wallet
                withdrawal.status = 'failed';
                withdrawal.failureReason = failureReason || 'Transfer failed';
                withdrawal.gatewayResponse = Object.assign(Object.assign({}, withdrawal.gatewayResponse), { failureReason, failedAt: new Date(), razorpayStatus: data.status });
                yield withdrawal.save();
                // Refund amount to wallet
                wallet.balance += withdrawal.amount;
                yield wallet.save();
                // Update transaction
                if (transaction) {
                    transaction.status = 'failed';
                    yield transaction.save();
                }
                console.log(`Withdrawal ${withdrawal._id} failed and refunded`);
                break;
            case 'payout.queued':
            case 'payout.pending':
                // Payout is pending - update status
                withdrawal.status = 'processing';
                withdrawal.gatewayResponse = Object.assign(Object.assign({}, withdrawal.gatewayResponse), { razorpayStatus: data.status });
                yield withdrawal.save();
                console.log(`Withdrawal ${withdrawal._id} is ${event}`);
                break;
            default:
                console.log('Unknown webhook event:', event);
        }
        // Send success response to Razorpay
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Webhook processed successfully',
            data: null,
        });
    }
    catch (error) {
        console.error('Webhook processing error:', error);
        // Still return 200 to Razorpay to prevent retries
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Webhook received but processing failed',
            data: null,
        });
    }
}));
/**
 * Manual sync transfer status
 * Admin can manually check status from Razorpay
 */
const syncTransferStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // withdrawal ID
    const withdrawal = yield wallet_model_1.WithdrawalRequest.findById(id);
    if (!withdrawal) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Withdrawal not found',
            data: null,
        });
    }
    if (!withdrawal.gatewayTransactionId) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'No gateway transaction ID found',
            data: null,
        });
    }
    try {
        // Get status from Razorpay
        const statusResponse = yield razorpayPayoutService_1.default.getTransferStatus(withdrawal.gatewayTransactionId);
        if (statusResponse.success && statusResponse.data) {
            const { transfer } = statusResponse.data;
            // Update withdrawal based on Razorpay status
            if (transfer.status === 'SUCCESS') {
                withdrawal.status = 'completed';
                withdrawal.processedAt = new Date();
                // Update wallet
                const wallet = yield wallet_model_1.Wallet.findById(withdrawal.walletId);
                if (wallet) {
                    wallet.totalWithdrawn += withdrawal.amount;
                    yield wallet.save();
                }
                // Update transaction
                const transaction = yield wallet_model_1.WalletTransaction.findOne({
                    referenceType: 'withdrawal',
                    referenceId: withdrawal._id,
                });
                if (transaction) {
                    transaction.status = 'completed';
                    yield transaction.save();
                }
            }
            else if (transfer.status === 'FAILED' || transfer.status === 'REVERSED') {
                withdrawal.status = 'failed';
                withdrawal.failureReason = transfer.reason || 'Transfer failed';
                // Refund to wallet
                const wallet = yield wallet_model_1.Wallet.findById(withdrawal.walletId);
                if (wallet) {
                    wallet.balance += withdrawal.amount;
                    yield wallet.save();
                }
                // Update transaction
                const transaction = yield wallet_model_1.WalletTransaction.findOne({
                    referenceType: 'withdrawal',
                    referenceId: withdrawal._id,
                });
                if (transaction) {
                    transaction.status = 'failed';
                    yield transaction.save();
                }
            }
            withdrawal.gatewayResponse = transfer;
            yield withdrawal.save();
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Transfer status synced successfully',
                data: withdrawal,
            });
        }
        else {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: statusResponse.message || 'Failed to get transfer status',
                data: null,
            });
        }
    }
    catch (error) {
        console.error('Sync transfer status error:', error);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message || 'Failed to sync transfer status',
            data: null,
        });
    }
}));
exports.default = {
    handlePayoutWebhook,
    syncTransferStatus,
};
