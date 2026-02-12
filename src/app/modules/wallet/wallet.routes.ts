import express from 'express';
import { WalletController } from './wallet.controller';
import RouteWebhookController from './wallet-payout-webhook.controller';
import { auth } from '../../middlewares/authMiddleware';

const router = express.Router();

// ==================== VENDOR/USER WALLET ROUTES ====================

/**
 * @swagger
 * /v1/api/wallet:
 *   get:
 *     summary: Get my wallet
 *     tags: [Wallet]
 */
router.get('/', auth('vendor', 'admin'), WalletController.getMyWallet);

/**
 * @swagger
 * /v1/api/wallet/stats:
 *   get:
 *     summary: Get wallet dashboard stats
 *     tags: [Wallet]
 */
router.get('/stats', auth('vendor', 'admin'), WalletController.getWalletStats);

/**
 * @swagger
 * /v1/api/wallet/transactions:
 *   get:
 *     summary: Get wallet transactions
 *     tags: [Wallet]
 */
router.get('/transactions', auth('vendor', 'admin'), WalletController.getWalletTransactions);

/**
 * @swagger
 * /v1/api/wallet/bank-details:
 *   put:
 *     summary: Update bank details
 *     tags: [Wallet]
 */
router.put('/bank-details', auth('vendor', 'admin'), WalletController.updateBankDetails);

/**
 * @swagger
 * /v1/api/wallet/bank-details:
 *   delete:
 *     summary: Delete bank details
 *     tags: [Wallet]
 */
router.delete('/bank-details', auth('vendor', 'admin'), WalletController.deleteBankDetails);

/**
 * @swagger
 * /v1/api/wallet/withdrawals:
 *   post:
 *     summary: Request withdrawal
 *     tags: [Wallet - Withdrawals]
 */
router.post('/withdrawals', auth('vendor'), WalletController.requestWithdrawal);

/**
 * @swagger
 * /v1/api/wallet/withdrawals:
 *   get:
 *     summary: Get my withdrawal history
 *     tags: [Wallet - Withdrawals]
 */
router.get('/withdrawals', auth('vendor', 'admin'), WalletController.getMyWithdrawals);

/**
 * @swagger
 * /v1/api/wallet/withdrawals/{id}/cancel:
 *   post:
 *     summary: Cancel withdrawal request
 *     tags: [Wallet - Withdrawals]
 */
router.post('/withdrawals/:id/cancel', auth('vendor'), WalletController.cancelWithdrawal);

// ==================== RAZORPAY ROUTE WEBHOOK ====================

/**
 * @swagger
 * /v1/api/wallet/webhooks/razorpay-route:
 *   post:
 *     summary: Razorpay Route Transfer Webhook (No Auth)
 *     tags: [Wallet - Webhooks]
 */
router.post('/webhooks/razorpay-route', RouteWebhookController.handleRouteWebhook);

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /v1/api/wallet/admin/wallets:
 *   get:
 *     summary: Get all wallets (Admin)
 *     tags: [Wallet - Admin]
 */
router.get('/admin/wallets', auth('admin'), WalletController.getAllWallets);

/**
 * @swagger
 * /v1/api/wallet/admin/stats:
 *   get:
 *     summary: Get admin wallet stats
 *     tags: [Wallet - Admin]
 */
router.get('/admin/stats', auth('admin'), WalletController.getAdminWalletStats);

/**
 * @swagger
 * /v1/api/wallet/admin/withdrawals:
 *   get:
 *     summary: Get all withdrawal requests (Admin)
 *     tags: [Wallet - Admin]
 */
router.get('/admin/withdrawals', auth('admin'), WalletController.getAllWithdrawals);

/**
 * @swagger
 * /v1/api/wallet/admin/withdrawals/{id}/process:
 *   post:
 *     summary: Process withdrawal request (Admin)
 *     tags: [Wallet - Admin]
 */
router.post('/admin/withdrawals/:id/process', auth('admin'), WalletController.processWithdrawal);

/**
 * @swagger
 * /v1/api/wallet/admin/transfers/{transferId}/sync-status:
 *   post:
 *     summary: Manually sync Route transfer status from Razorpay (Admin)
 *     tags: [Wallet - Admin]
 */
router.post('/admin/transfers/:transferId/sync-status', auth('admin'), RouteWebhookController.syncTransferStatus);

export default router;
