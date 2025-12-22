"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationRefundRouter = void 0;
const express_1 = __importDefault(require("express"));
const cancellation_refund_controller_1 = require("./cancellation-refund.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
router.get('/', cancellation_refund_controller_1.getCancellationRefund);
router.put('/', (0, authMiddleware_1.auth)('admin'), cancellation_refund_controller_1.updateCancellationRefund);
exports.CancellationRefundRouter = router;
