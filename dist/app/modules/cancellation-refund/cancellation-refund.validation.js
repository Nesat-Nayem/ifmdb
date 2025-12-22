"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationRefundValidation = void 0;
const zod_1 = require("zod");
exports.CancellationRefundValidation = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Cancellation & Refund Policy content is required')
});
