"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wallet_controller_1 = require("./wallet.controller");
const wallet_payout_webhook_controller_1 = __importDefault(require("./wallet-payout-webhook.controller"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
// ==================== VENDOR/USER WALLET ROUTES ====================
/**
 * @swagger
 * /v1/api/wallet:
 *   get:
 *     summary: Get my wallet
 *     tags: [Wallet]
 */
router.get('/', (0, authMiddleware_1.auth)('vendor', 'admin'), wallet_controller_1.WalletController.getMyWallet);
/**
 * @swagger
 * /v1/api/wallet/stats:
 *   get:
 *     summary: Get wallet dashboard stats
 *     tags: [Wallet]
 */
router.get('/stats', (0, authMiddleware_1.auth)('vendor', 'admin'), wallet_controller_1.WalletController.getWalletStats);
/**
 * @swagger
 * /v1/api/wallet/transactions:
 *   get:
 *     summary: Get wallet transactions
 *     tags: [Wallet]
 */
router.get('/transactions', (0, authMiddleware_1.auth)('vendor', 'admin'), wallet_controller_1.WalletController.getWalletTransactions);
/**
 * @swagger
 * /v1/api/wallet/bank-details:
 *   put:
 *     summary: Update bank details
 *     tags: [Wallet]
 */
router.put('/bank-details', (0, authMiddleware_1.auth)('vendor', 'admin'), wallet_controller_1.WalletController.updateBankDetails);
/**
 * @swagger
 * /v1/api/wallet/bank-details:
 *   delete:
 *     summary: Delete bank details
 *     tags: [Wallet]
 */
router.delete('/bank-details', (0, authMiddleware_1.auth)('vendor', 'admin'), wallet_controller_1.WalletController.deleteBankDetails);
/**
 * @swagger
 * /v1/api/wallet/withdrawals:
 *   post:
 *     summary: Request withdrawal
 *     tags: [Wallet - Withdrawals]
 */
router.post('/withdrawals', (0, authMiddleware_1.auth)('vendor'), wallet_controller_1.WalletController.requestWithdrawal);
/**
 * @swagger
 * /v1/api/wallet/withdrawals:
 *   get:
 *     summary: Get my withdrawal history
 *     tags: [Wallet - Withdrawals]
 */
router.get('/withdrawals', (0, authMiddleware_1.auth)('vendor', 'admin'), wallet_controller_1.WalletController.getMyWithdrawals);
/**
 * @swagger
 * /v1/api/wallet/withdrawals/{id}/cancel:
 *   post:
 *     summary: Cancel withdrawal request
 *     tags: [Wallet - Withdrawals]
 */
router.post('/withdrawals/:id/cancel', (0, authMiddleware_1.auth)('vendor'), wallet_controller_1.WalletController.cancelWithdrawal);
// ==================== RAZORPAY ROUTE WEBHOOK ====================
/**
 * @swagger
 * /v1/api/wallet/webhooks/razorpay-route:
 *   post:
 *     summary: Razorpay Route Transfer Webhook (No Auth)
 *     tags: [Wallet - Webhooks]
 */
router.post('/webhooks/razorpay-route', wallet_payout_webhook_controller_1.default.handleRouteWebhook);
// ==================== ADMIN ROUTES ====================
/**
 * @swagger
 * /v1/api/wallet/admin/wallets:
 *   get:
 *     summary: Get all wallets (Admin)
 *     tags: [Wallet - Admin]
 */
router.get('/admin/wallets', (0, authMiddleware_1.auth)('admin'), wallet_controller_1.WalletController.getAllWallets);
/**
 * @swagger
 * /v1/api/wallet/admin/stats:
 *   get:
 *     summary: Get admin wallet stats
 *     tags: [Wallet - Admin]
 */
router.get('/admin/stats', (0, authMiddleware_1.auth)('admin'), wallet_controller_1.WalletController.getAdminWalletStats);
/**
 * @swagger
 * /v1/api/wallet/admin/withdrawals:
 *   get:
 *     summary: Get all withdrawal requests (Admin)
 *     tags: [Wallet - Admin]
 */
router.get('/admin/withdrawals', (0, authMiddleware_1.auth)('admin'), wallet_controller_1.WalletController.getAllWithdrawals);
/**
 * @swagger
 * /v1/api/wallet/admin/withdrawals/{id}/process:
 *   post:
 *     summary: Process withdrawal request (Admin)
 *     tags: [Wallet - Admin]
 */
router.post('/admin/withdrawals/:id/process', (0, authMiddleware_1.auth)('admin'), wallet_controller_1.WalletController.processWithdrawal);
/**
 * @swagger
 * /v1/api/wallet/admin/transfers/{transferId}/sync-status:
 *   post:
 *     summary: Manually sync Route transfer status from Razorpay (Admin)
 *     tags: [Wallet - Admin]
 */
router.post('/admin/transfers/:transferId/sync-status', (0, authMiddleware_1.auth)('admin'), wallet_payout_webhook_controller_1.default.syncTransferStatus);
exports.default = router;
