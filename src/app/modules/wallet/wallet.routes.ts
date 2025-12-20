import express from 'express';
import { WalletController } from './wallet.controller';
import PayoutWebhookController from './wallet-payout-webhook.controller';
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

// ==================== CASHFREE PAYOUT WEBHOOK ====================

/**
 * @swagger
 * /v1/api/wallet/webhooks/cashfree-payout:
 *   post:
 *     summary: Cashfree Payout Webhook (No Auth)
 *     tags: [Wallet - Webhooks]
 */
router.post('/webhooks/cashfree-payout', PayoutWebhookController.handlePayoutWebhook);

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
 * /v1/api/wallet/admin/withdrawals/{id}/sync-status:
 *   post:
 *     summary: Manually sync transfer status from Cashfree (Admin)
 *     tags: [Wallet - Admin]
 */
router.post('/admin/withdrawals/:id/sync-status', auth('admin'), PayoutWebhookController.syncTransferStatus);

export default router;
