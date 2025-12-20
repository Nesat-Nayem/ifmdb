# Cashfree Payouts Setup Guide

## 🎯 Overview

This guide explains how to set up Cashfree Payouts for automatic vendor withdrawals. With this integration, vendors can request withdrawals and receive money directly to their bank accounts within 24 hours without any admin intervention.

---

## 📋 Prerequisites

1. **Cashfree Account** - Sign up at [https://www.cashfree.com](https://www.cashfree.com)
2. **KYC Verification** - Complete KYC for your business
3. **Payouts Enabled** - Request Cashfree to enable Payouts on your account

---

## 🔑 Step 1: Get Cashfree Payout Credentials

### 1.1 Login to Cashfree Dashboard

Go to [https://merchant.cashfree.com](https://merchant.cashfree.com)

### 1.2 Navigate to Payouts Section

- Click on **"Payouts"** in the left sidebar
- Go to **"Developers"** → **"Credentials"**

### 1.3 Get Your Credentials

You'll need:
- **Client ID** (e.g., `CF123456789`)
- **Client Secret** (e.g., `cfsk_ma_test_xxxxxxxxxxxxx`)

**Note:** You'll have separate credentials for:
- **TEST Environment** - For development/testing
- **PROD Environment** - For production

---

## 🔧 Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# Cashfree Payouts (for vendor withdrawals)
CASHFREE_PAYOUT_CLIENT_ID=your_payout_client_id_here
CASHFREE_PAYOUT_CLIENT_SECRET=your_payout_client_secret_here
CASHFREE_PAYOUT_ENV=TEST  # Use TEST for development, PROD for production
```

### Example (Test Environment):
```env
CASHFREE_PAYOUT_CLIENT_ID=CF123456789
CASHFREE_PAYOUT_CLIENT_SECRET=cfsk_ma_test_abc123xyz456
CASHFREE_PAYOUT_ENV=TEST
```

### Example (Production Environment):
```env
CASHFREE_PAYOUT_CLIENT_ID=CF987654321
CASHFREE_PAYOUT_CLIENT_SECRET=cfsk_ma_prod_xyz789abc123
CASHFREE_PAYOUT_ENV=PROD
```

---

## 💰 Step 3: Add Balance to Payout Account

### 3.1 Load Money

1. Go to Cashfree Dashboard → **Payouts** → **Add Balance**
2. Transfer money from your bank to Cashfree Payout account
3. Minimum balance: ₹1000 (recommended: ₹50,000+)

### 3.2 Check Balance

You can check your payout balance via:
- Cashfree Dashboard
- API: `GET /payout/v1/getBalance`

**Important:** Ensure you have sufficient balance before vendors request withdrawals!

---

## 🔔 Step 4: Configure Webhook

Webhooks notify your system when transfers complete.

### 4.1 Set Webhook URL

1. Go to Cashfree Dashboard → **Payouts** → **Developers** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/v1/api/wallet/webhooks/cashfree-payout`
3. Select events:
   - ✅ `TRANSFER_SUCCESS`
   - ✅ `TRANSFER_FAILED`
   - ✅ `TRANSFER_REVERSED`

### 4.2 Webhook Security

Cashfree sends a signature with each webhook. Our system automatically verifies it using your Client Secret.

**Webhook Payload Example:**
```json
{
  "event": "TRANSFER_SUCCESS",
  "data": {
    "transferId": "WD_123_1234567890",
    "status": "SUCCESS",
    "utr": "HDFC123456789",
    "amount": 5000,
    "beneId": "VENDOR_123_1234567890"
  },
  "signature": "base64_encoded_signature",
  "timestamp": "1640000000"
}
```

---

## 🧪 Step 5: Test the Integration

### 5.1 Test in Sandbox Mode

1. Set `CASHFREE_PAYOUT_ENV=TEST`
2. Use test credentials
3. Add test balance (₹10,000 free in test mode)

### 5.2 Test Withdrawal Flow

```bash
# 1. Vendor adds bank details
POST /v1/api/wallet/bank-details
{
  "accountHolderName": "John Doe",
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234",
  "bankName": "HDFC Bank"
}

# 2. Vendor requests withdrawal
POST /v1/api/wallet/withdrawals
{
  "amount": 1000
}

# 3. Check withdrawal status
GET /v1/api/wallet/withdrawals
```

### 5.3 Expected Response

```json
{
  "success": true,
  "message": "Withdrawal initiated successfully. Funds will be transferred to your bank within 24 hours.",
  "data": {
    "_id": "64abc123...",
    "amount": 1000,
    "status": "processing",
    "gatewayTransactionId": "WD_64abc123_1640000000",
    "transferId": "WD_64abc123_1640000000",
    "estimatedTime": "24 hours"
  }
}
```

---

## 📊 Step 6: Monitor Payouts

### 6.1 Admin Dashboard

Admins can view all withdrawals at:
- **Admin Panel** → **Wallet** → **Withdrawals**

### 6.2 Withdrawal Statuses

| Status | Description |
|--------|-------------|
| `processing` | Transfer initiated with Cashfree |
| `completed` | Money transferred successfully |
| `failed` | Transfer failed (amount refunded) |
| `cancelled` | Vendor cancelled before processing |

### 6.3 Manual Status Sync

If webhook fails, admin can manually sync:

```bash
POST /v1/api/wallet/admin/withdrawals/{id}/sync-status
```

---

## 🔒 Security Best Practices

### 1. **Protect Credentials**
- Never commit `.env` file to Git
- Use environment variables in production
- Rotate secrets periodically

### 2. **Webhook Verification**
- Always verify webhook signatures
- Our system does this automatically

### 3. **IP Whitelisting** (Optional)
- Whitelist Cashfree IPs in your firewall
- Cashfree IPs: Check their documentation

### 4. **HTTPS Only**
- Use HTTPS for webhook URLs
- Required for production

---

## 🚨 Troubleshooting

### Issue: "Cashfree Payouts not configured"

**Solution:**
- Check if `CASHFREE_PAYOUT_CLIENT_ID` and `CASHFREE_PAYOUT_CLIENT_SECRET` are set
- Restart your backend server after adding env variables

### Issue: "Insufficient balance"

**Solution:**
- Add money to your Cashfree Payout account
- Check balance: `GET /payout/v1/getBalance`

### Issue: "Invalid beneficiary details"

**Solution:**
- Verify IFSC code is correct (11 characters)
- Account number should match bank records
- Account holder name should match exactly

### Issue: "Transfer failed"

**Possible Reasons:**
- Invalid bank account details
- Bank account inactive/frozen
- IFSC code incorrect
- Beneficiary name mismatch

**Solution:**
- Vendor should verify bank details
- Try with a different bank account
- Contact Cashfree support

### Issue: "Webhook not received"

**Solution:**
- Check webhook URL is publicly accessible
- Verify webhook is configured in Cashfree dashboard
- Check server logs for webhook errors
- Use manual sync: `POST /admin/withdrawals/{id}/sync-status`

---

## 📞 Support

### Cashfree Support
- Email: care@cashfree.com
- Phone: +91-80-61799600
- Documentation: https://docs.cashfree.com/reference/payouts-api-overview

### Integration Support
- Check our code: `/backend/src/app/services/cashfreePayoutService.ts`
- Webhook handler: `/backend/src/app/modules/wallet/wallet-payout-webhook.controller.ts`

---

## ✅ Checklist

Before going live:

- [ ] Cashfree account created and KYC completed
- [ ] Payouts enabled on account
- [ ] Production credentials obtained
- [ ] Environment variables configured
- [ ] Sufficient balance added to payout account
- [ ] Webhook URL configured
- [ ] Test withdrawal completed successfully
- [ ] Webhook received and processed
- [ ] Admin can view withdrawal status
- [ ] Error handling tested (failed transfers)

---

## 🎉 You're All Set!

Vendors can now:
1. Add their bank details
2. Request withdrawals
3. Receive money automatically within 24 hours

No admin intervention required! 🚀
