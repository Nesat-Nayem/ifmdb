"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const iap_payment_controller_1 = require("./iap-payment.controller");
const router = (0, express_1.Router)();
// Verify In-App Purchase receipt (Apple IAP / Google Play)
router.post("/verify-iap", iap_payment_controller_1.verifyIAPReceipt);
exports.default = router;
