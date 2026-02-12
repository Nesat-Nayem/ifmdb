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

import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { Wallet, WalletTransaction } from './wallet.model';
import razorpayRouteService from '../../services/razorpayRouteService';

/**
 * Handle Razorpay Route Webhook
 */
const handleRouteWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const payload = JSON.stringify(req.body);

  // Verify webhook signature
  const isValid = razorpayRouteService.verifyWebhookSignature(payload, signature);

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
        const transfer = webhookPayload?.transfer?.entity;
        if (transfer) {
          const transferId = transfer.id;
          const recipientAccountId = transfer.recipient;

          // Find wallet transaction by Route transfer ID
          const walletTransaction = await WalletTransaction.findOne({
            razorpayTransferId: transferId,
          });

          if (walletTransaction) {
            console.log(`Route transfer ${transferId} processed for wallet transaction ${walletTransaction._id}`);
          }

          // Find wallet by linked account ID and log
          const wallet = await Wallet.findOne({ razorpayLinkedAccountId: recipientAccountId });
          if (wallet) {
            console.log(`Route transfer ${transferId} processed for vendor wallet ${wallet._id}`);
          }
        }
        break;
      }

      case 'transfer.settled': {
        // Transfer settled to vendor's bank account
        const transfer = webhookPayload?.transfer?.entity;
        if (transfer) {
          const transferId = transfer.id;
          const recipientAccountId = transfer.recipient;
          const settlementId = transfer.recipient_settlement_id;

          // Find wallet transaction and update
          const walletTransaction = await WalletTransaction.findOne({
            razorpayTransferId: transferId,
          });

          if (walletTransaction) {
            // Move from pending to available in vendor wallet
            const wallet = await Wallet.findById(walletTransaction.walletId);
            if (wallet) {
              const amount = walletTransaction.netAmount;
              wallet.pendingBalance = Math.max(0, wallet.pendingBalance - amount);
              wallet.balance += amount;
              await wallet.save();

              console.log(`Route transfer ${transferId} settled. Vendor wallet ${wallet._id} updated: +₹${amount} available`);
            }
          }

          // Also try finding by linked account
          if (!walletTransaction) {
            const wallet = await Wallet.findOne({ razorpayLinkedAccountId: recipientAccountId });
            if (wallet) {
              console.log(`Route transfer ${transferId} settled for linked account ${recipientAccountId}, settlement: ${settlementId}`);
            }
          }
        }
        break;
      }

      case 'transfer.failed': {
        // Transfer failed
        const transfer = webhookPayload?.transfer?.entity;
        if (transfer) {
          const transferId = transfer.id;
          const errorDesc = transfer.error?.description || 'Transfer failed';

          // Find wallet transaction and revert
          const walletTransaction = await WalletTransaction.findOne({
            razorpayTransferId: transferId,
          });

          if (walletTransaction) {
            walletTransaction.status = 'failed';
            await walletTransaction.save();

            // Revert pending balance
            const wallet = await Wallet.findById(walletTransaction.walletId);
            if (wallet) {
              wallet.pendingBalance = Math.max(0, wallet.pendingBalance - walletTransaction.netAmount);
              wallet.totalEarnings = Math.max(0, wallet.totalEarnings - walletTransaction.netAmount);
              await wallet.save();

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
  } catch (error: any) {
    console.error('Route webhook processing error:', error);
    // Return 200 to prevent retries
    return res.status(200).json({ received: true });
  }
});

/**
 * Manual sync Route transfer status
 * Admin can check transfer status from Razorpay
 */
const syncTransferStatus = catchAsync(async (req: Request, res: Response) => {
  const { transferId } = req.params;

  if (!transferId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Transfer ID is required',
      data: null,
    });
  }

  try {
    const result = await razorpayRouteService.fetchTransfer(transferId);

    if (result.success) {
      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Transfer status fetched successfully',
        data: result.data,
      });
    } else {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: result.message,
        data: null,
      });
    }
  } catch (error: any) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || 'Failed to fetch transfer status',
      data: null,
    });
  }
});

export default {
  handleRouteWebhook,
  syncTransferStatus,
};
