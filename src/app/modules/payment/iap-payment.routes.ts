import { Router } from "express";
import { verifyIAPReceipt } from "./iap-payment.controller";

const router = Router();

// Verify In-App Purchase receipt (Apple IAP / Google Play)
router.post("/verify-iap", verifyIAPReceipt);

export default router;
