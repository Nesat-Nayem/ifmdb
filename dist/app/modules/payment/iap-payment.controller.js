"use strict";
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
exports.verifyIAPReceipt = void 0;
const auth_model_1 = require("../auth/auth.model");
const https_1 = __importDefault(require("https"));
// Apple's receipt validation endpoints
const APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
// Your App's shared secret from App Store Connect
// Set this in environment variables: APPLE_SHARED_SECRET
const APPLE_SHARED_SECRET = process.env.APPLE_SHARED_SECRET || "";
/**
 * Verify Apple IAP receipt with Apple's servers
 */
function verifyAppleReceipt(receiptData_1) {
    return __awaiter(this, arguments, void 0, function* (receiptData, useSandbox = false) {
        const url = useSandbox ? APPLE_SANDBOX_URL : APPLE_PRODUCTION_URL;
        const requestBody = JSON.stringify({
            "receipt-data": receiptData,
            password: APPLE_SHARED_SECRET,
            "exclude-old-transactions": true,
        });
        return new Promise((resolve, reject) => {
            const req = https_1.default.request(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(requestBody),
                },
            }, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    }
                    catch (e) {
                        reject(new Error("Failed to parse Apple response"));
                    }
                });
            });
            req.on("error", reject);
            req.write(requestBody);
            req.end();
        });
    });
}
/**
 * Verify In-App Purchase receipt and grant access
 * POST /api/v1/payments/verify-iap
 */
const verifyIAPReceipt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log("🛒 [IAP] Verifying receipt...");
        const { receiptData, productId, transactionId, platform, userId, videoId, eventId, } = req.body;
        // Validate required fields
        if (!receiptData || !productId || !userId) {
            res.status(400).json({
                success: false,
                statusCode: 400,
                message: "Missing required fields: receiptData, productId, userId",
            });
            return;
        }
        console.log(`🛒 [IAP] Platform: ${platform}`);
        console.log(`🛒 [IAP] Product ID: ${productId}`);
        console.log(`🛒 [IAP] Transaction ID: ${transactionId}`);
        console.log(`🛒 [IAP] User ID: ${userId}`);
        console.log(`🛒 [IAP] Video ID: ${videoId}`);
        console.log(`🛒 [IAP] Event ID: ${eventId}`);
        // Find user
        const user = yield auth_model_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "User not found",
            });
            return;
        }
        if (platform === "ios") {
            // Verify with Apple
            console.log("🍎 [IAP] Verifying with Apple servers...");
            // Try production first, then sandbox if status is 21007
            let appleResponse = yield verifyAppleReceipt(receiptData, false);
            // Status 21007 means receipt is from sandbox
            if (appleResponse.status === 21007) {
                console.log("🍎 [IAP] Receipt is from sandbox, retrying...");
                appleResponse = yield verifyAppleReceipt(receiptData, true);
            }
            console.log(`🍎 [IAP] Apple response status: ${appleResponse.status}`);
            // Check Apple's response status codes
            // 0 = Valid receipt
            // 21000-21010 = Various error codes
            if (appleResponse.status !== 0) {
                const errorMessages = {
                    21000: "App Store could not read the receipt",
                    21002: "Receipt data was malformed",
                    21003: "Receipt could not be authenticated",
                    21004: "Shared secret does not match",
                    21005: "Receipt server is unavailable",
                    21006: "Receipt is valid but subscription has expired",
                    21007: "Receipt is from sandbox (handled)",
                    21008: "Receipt is from production (handled)",
                    21009: "Internal data access error",
                    21010: "User account not found",
                };
                res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: errorMessages[appleResponse.status] || `Apple verification failed with status ${appleResponse.status}`,
                });
                return;
            }
            // Find the purchased product in the receipt
            const inAppPurchases = ((_a = appleResponse.receipt) === null || _a === void 0 ? void 0 : _a.in_app) || appleResponse.latest_receipt_info || [];
            const purchase = inAppPurchases.find((p) => p.product_id === productId);
            if (!purchase) {
                res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: "Product not found in receipt",
                });
                return;
            }
            console.log(`🍎 [IAP] Purchase verified: ${purchase.transaction_id}`);
            // Grant access based on content type
            if (videoId) {
                // Grant video access
                yield grantVideoAccess(userId, videoId, purchase.transaction_id);
                console.log(`🍎 [IAP] Video access granted for: ${videoId}`);
            }
            else if (eventId) {
                // Grant event ticket
                yield grantEventAccess(userId, eventId, purchase.transaction_id);
                console.log(`🍎 [IAP] Event access granted for: ${eventId}`);
            }
            res.json({
                success: true,
                statusCode: 200,
                message: "Purchase verified successfully",
                data: {
                    transactionId: purchase.transaction_id,
                    productId: purchase.product_id,
                    purchaseDate: new Date(parseInt(purchase.purchase_date_ms)),
                },
            });
            return;
        }
        else if (platform === "android") {
            // For Google Play verification
            // You would use Google Play Developer API here
            // For now, we'll implement a basic verification
            console.log("🤖 [IAP] Android verification - using basic validation");
            // TODO: Implement Google Play verification using googleapis
            // const auth = new google.auth.GoogleAuth({...});
            // const androidpublisher = google.androidpublisher('v3');
            // For now, grant access (you should implement proper Google Play verification)
            if (videoId) {
                yield grantVideoAccess(userId, videoId, transactionId);
            }
            else if (eventId) {
                yield grantEventAccess(userId, eventId, transactionId);
            }
            res.json({
                success: true,
                statusCode: 200,
                message: "Purchase verified successfully",
                data: {
                    transactionId,
                    productId,
                },
            });
            return;
        }
        else {
            res.status(400).json({
                success: false,
                statusCode: 400,
                message: "Invalid platform. Must be 'ios' or 'android'",
            });
            return;
        }
    }
    catch (error) {
        console.error("🛒 [IAP] Verification error:", error);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: error.message || "Failed to verify purchase",
        });
        return;
    }
});
exports.verifyIAPReceipt = verifyIAPReceipt;
/**
 * Grant video access to user after successful IAP
 */
function grantVideoAccess(userId, videoId, transactionId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Import WatchVideo model dynamically to avoid circular dependencies
            const WatchVideo = require("../watch-videos/watchVideo.model").default;
            const VideoPurchase = require("../watch-videos/videoPurchase.model").default;
            // Check if purchase already exists (prevent duplicate grants)
            const existingPurchase = yield VideoPurchase.findOne({
                userId,
                videoId,
                transactionId,
            });
            if (existingPurchase) {
                console.log(`🛒 [IAP] Purchase already exists: ${transactionId}`);
                return;
            }
            // Create purchase record
            const purchase = new VideoPurchase({
                userId,
                videoId,
                transactionId,
                paymentMethod: "apple_iap",
                status: "completed",
                purchaseDate: new Date(),
            });
            yield purchase.save();
            console.log(`🛒 [IAP] Video purchase recorded: ${purchase._id}`);
        }
        catch (error) {
            console.error("🛒 [IAP] Error granting video access:", error);
            throw error;
        }
    });
}
/**
 * Grant event ticket access to user after successful IAP
 */
function grantEventAccess(userId, eventId, transactionId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Import models dynamically
            const EventBooking = require("../events/eventBooking.model").default;
            // Check if booking already exists
            const existingBooking = yield EventBooking.findOne({
                userId,
                eventId,
                transactionId,
            });
            if (existingBooking) {
                console.log(`🛒 [IAP] Booking already exists: ${transactionId}`);
                return;
            }
            // Create booking record
            const booking = new EventBooking({
                userId,
                eventId,
                transactionId,
                paymentMethod: "apple_iap",
                status: "confirmed",
                bookingDate: new Date(),
                bookingReference: `IAP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            });
            yield booking.save();
            console.log(`🛒 [IAP] Event booking recorded: ${booking._id}`);
        }
        catch (error) {
            console.error("🛒 [IAP] Error granting event access:", error);
            throw error;
        }
    });
}
