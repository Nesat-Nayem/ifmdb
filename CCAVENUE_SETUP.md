# CCAvenue Payment Gateway Setup Guide

This guide explains how to set up CCAvenue payment gateway for international (non-Indian) users in MovieMart.

## Overview

- **Indian Users**: Use Cashfree payment gateway (already implemented)
- **International Users**: Use CCAvenue payment gateway

## Getting CCAvenue API Credentials

Since you already have a CCAvenue account used for another project, follow these steps to get API credentials for MovieMart:

### Step 1: Login to CCAvenue Dashboard

1. Go to [CCAvenue Dashboard](https://dashboard.ccavenue.com)
2. Login with your merchant credentials

### Step 2: Get Merchant ID

1. After login, your **Merchant ID** is displayed on the dashboard
2. It's also available in: **Settings → API Keys**
3. This is a unique identifier for your merchant account

### Step 3: Generate Access Code & Working Key

1. Navigate to: **Settings → API Keys**
2. Or go to: **Resources → Integration → API Keys**
3. You'll see:
   - **Access Code**: Used for authentication
   - **Working Key (Encryption Key)**: Used for encrypting/decrypting data

**Important**: If you're using the same CCAvenue account for multiple projects:
- The same Merchant ID, Access Code, and Working Key can be used
- However, you need to **whitelist the domains** for each project

### Step 4: Whitelist Your Domains

1. Navigate to: **Settings → IP/URL Whitelisting**
2. Add your domains:
   - **Development**: `http://localhost:3000` (or your dev port)
   - **Production**: `https://yourdomain.com`
3. Add your backend URL for webhooks:
   - **Development**: `http://localhost:8080`
   - **Production**: `https://api.yourdomain.com`

### Step 5: Configure Redirect URLs

1. Navigate to: **Settings → Redirect URLs**
2. Set up:
   - **Redirect URL**: Where users are sent after payment
   - **Cancel URL**: Where users are sent if they cancel

## Environment Variables

Add these to your `.env` file:

```env
# CCAvenue Payment Gateway (for international users)
CCAVENUE_MERCHANT_ID=your_merchant_id_here
CCAVENUE_ACCESS_CODE=your_access_code_here
CCAVENUE_WORKING_KEY=your_working_key_here
CCAVENUE_ENV=test
CCAVENUE_REDIRECT_URL=http://localhost:3000/payment/ccavenue/callback
CCAVENUE_CANCEL_URL=http://localhost:3000/payment/ccavenue/cancel
```

For **production**, update:
```env
CCAVENUE_ENV=production
CCAVENUE_REDIRECT_URL=https://yourdomain.com/payment/ccavenue/callback
CCAVENUE_CANCEL_URL=https://yourdomain.com/payment/ccavenue/cancel
```

## How It Works

### Payment Flow

1. **User initiates payment** on frontend
2. **Backend detects country**:
   - If India (IN) → Use Cashfree
   - If any other country → Use CCAvenue
3. **For CCAvenue**:
   - Backend creates encrypted order data
   - Frontend receives encrypted request + CCAvenue URL
   - User is redirected to CCAvenue payment page
   - User completes payment
   - CCAvenue redirects back with encrypted response
   - Backend decrypts and processes the response

### Country Detection

The system uses:
1. User's geolocation (Google Geolocation API on frontend)
2. Country code from country-wise pricing settings
3. Fallback to browser locale

## Supported Currencies

CCAvenue supports 40+ currencies including:
- USD, GBP, EUR, AED, SGD, AUD, CAD, JPY
- And many more (see `ccavenueService.ts`)

## Testing

### Test Mode

1. Set `CCAVENUE_ENV=test` in `.env`
2. Use test credentials from CCAvenue dashboard
3. Use test card numbers provided by CCAvenue

### Test Card Numbers

| Card Type | Card Number | Expiry | CVV |
|-----------|-------------|--------|-----|
| Visa | 4111111111111111 | Any future date | Any 3 digits |
| Mastercard | 5500000000000004 | Any future date | Any 3 digits |

## API Endpoints

### Watch Videos Payment
- **POST** `/v1/api/watch-videos/:videoId/payment/create-order`
  - Automatically routes to Cashfree (India) or CCAvenue (International)

### Events Payment
- **POST** `/v1/api/events/:eventId/cashfree/create-order`
  - Automatically routes to Cashfree (India) or CCAvenue (International)

### CCAvenue Callback
- **POST** `/v1/api/payment/ccavenue/callback`
  - Handles CCAvenue response after payment

## Troubleshooting

### Common Issues

1. **"Invalid Request"**: Check if domain is whitelisted
2. **"Encryption Error"**: Verify Working Key is correct
3. **"Authentication Failed"**: Check Access Code and Merchant ID

### Debug Mode

Enable debug logging in development:
```env
DEBUG=ccavenue:*
```

## Security Notes

1. **Never expose Working Key** on frontend
2. All encryption/decryption happens on backend
3. Use HTTPS in production
4. Validate all callback responses

## Support

- CCAvenue Support: support@ccavenue.com
- Documentation: https://dashboard.ccavenue.com/resources/integrationKit.do
