/**
 * Razorpay Payout Webhook Handler
 * 
 * Handles webhook notifications from Razorpay Payouts (RazorpayX)
 * Updates withdrawal status automatically when transfer completes
 */

import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { Wallet, WalletTransaction, WithdrawalRequest } from './wallet.model';
import razorpayPayoutService from '../../services/razorpayPayoutService';

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
const handlePayoutWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const payload = JSON.stringify(req.body);

  // Verify webhook signature
  const isValid = razorpayPayoutService.verifyWebhookSignature(
    payload,
    signature
  );

  if (!isValid) {
    console.error('Invalid webhook signature');
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Invalid signature',
      data: null,
    });
  }

  const { event, payload: webhookPayload } = req.body;
  const data = webhookPayload?.payout?.entity;
  
  console.log('Razorpay Payout Webhook Received:', event, data);

  try {
    if (!data) {
      console.log('No payout data in webhook');
      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Webhook received but no payout data',
        data: null,
      });
    }

    const payoutId = data.id;
    const utr = data.utr;
    const failureReason = data.failure_reason;

    // Find withdrawal request by gateway transaction ID (payout ID)
    const withdrawal = await WithdrawalRequest.findOne({
      gatewayTransactionId: payoutId,
    });

    if (!withdrawal) {
      console.error('Withdrawal not found for payoutId:', payoutId);
      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Webhook received but withdrawal not found',
        data: null,
      });
    }

    const wallet = await Wallet.findById(withdrawal.walletId);
    const transaction = await WalletTransaction.findOne({
      referenceType: 'withdrawal',
      referenceId: withdrawal._id,
    });

    if (!wallet) {
      console.error('Wallet not found for withdrawal:', withdrawal._id);
      return sendResponse(res, {
        statusCode: httpStatus.OK,
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
        withdrawal.gatewayResponse = {
          ...withdrawal.gatewayResponse,
          utr,
          completedAt: new Date(),
          razorpayStatus: data.status,
        };
        await withdrawal.save();

        // Update transaction
        if (transaction) {
          transaction.status = 'completed';
          await transaction.save();
        }

        // Update wallet stats
        wallet.totalWithdrawn += withdrawal.amount;
        await wallet.save();

        console.log(`Withdrawal ${withdrawal._id} completed successfully`);
        break;

      case 'payout.failed':
      case 'payout.reversed':
        // Payout failed or reversed - refund to wallet
        withdrawal.status = 'failed';
        withdrawal.failureReason = failureReason || 'Transfer failed';
        withdrawal.gatewayResponse = {
          ...withdrawal.gatewayResponse,
          failureReason,
          failedAt: new Date(),
          razorpayStatus: data.status,
        };
        await withdrawal.save();

        // Refund amount to wallet
        wallet.balance += withdrawal.amount;
        await wallet.save();

        // Update transaction
        if (transaction) {
          transaction.status = 'failed';
          await transaction.save();
        }

        console.log(`Withdrawal ${withdrawal._id} failed and refunded`);
        break;

      case 'payout.queued':
      case 'payout.pending':
        // Payout is pending - update status
        withdrawal.status = 'processing';
        withdrawal.gatewayResponse = {
          ...withdrawal.gatewayResponse,
          razorpayStatus: data.status,
        };
        await withdrawal.save();
        console.log(`Withdrawal ${withdrawal._id} is ${event}`);
        break;

      default:
        console.log('Unknown webhook event:', event);
    }

    // Send success response to Razorpay
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Webhook processed successfully',
      data: null,
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Still return 200 to Razorpay to prevent retries
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Webhook received but processing failed',
      data: null,
    });
  }
});

/**
 * Manual sync transfer status
 * Admin can manually check status from Razorpay
 */
const syncTransferStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // withdrawal ID

  const withdrawal = await WithdrawalRequest.findById(id);

  if (!withdrawal) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Withdrawal not found',
      data: null,
    });
  }

  if (!withdrawal.gatewayTransactionId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'No gateway transaction ID found',
      data: null,
    });
  }

  try {
    // Get status from Razorpay
    const statusResponse = await razorpayPayoutService.getTransferStatus(
      withdrawal.gatewayTransactionId
    );

    if (statusResponse.success && statusResponse.data) {
      const { transfer } = statusResponse.data;

      // Update withdrawal based on Razorpay status
      if (transfer.status === 'SUCCESS') {
        withdrawal.status = 'completed';
        withdrawal.processedAt = new Date();
        
        // Update wallet
        const wallet = await Wallet.findById(withdrawal.walletId);
        if (wallet) {
          wallet.totalWithdrawn += withdrawal.amount;
          await wallet.save();
        }

        // Update transaction
        const transaction = await WalletTransaction.findOne({
          referenceType: 'withdrawal',
          referenceId: withdrawal._id,
        });
        if (transaction) {
          transaction.status = 'completed';
          await transaction.save();
        }
      } else if (transfer.status === 'FAILED' || transfer.status === 'REVERSED') {
        withdrawal.status = 'failed';
        withdrawal.failureReason = transfer.reason || 'Transfer failed';
        
        // Refund to wallet
        const wallet = await Wallet.findById(withdrawal.walletId);
        if (wallet) {
          wallet.balance += withdrawal.amount;
          await wallet.save();
        }

        // Update transaction
        const transaction = await WalletTransaction.findOne({
          referenceType: 'withdrawal',
          referenceId: withdrawal._id,
        });
        if (transaction) {
          transaction.status = 'failed';
          await transaction.save();
        }
      }

      withdrawal.gatewayResponse = transfer;
      await withdrawal.save();

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Transfer status synced successfully',
        data: withdrawal,
      });
    } else {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: statusResponse.message || 'Failed to get transfer status',
        data: null,
      });
    }
  } catch (error: any) {
    console.error('Sync transfer status error:', error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || 'Failed to sync transfer status',
      data: null,
    });
  }
});

export default {
  handlePayoutWebhook,
  syncTransferStatus,
};
