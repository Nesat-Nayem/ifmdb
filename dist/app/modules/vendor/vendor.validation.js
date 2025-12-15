"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorDecisionValidation = exports.vendorCreateValidation = void 0;
const zod_1 = require("zod");
exports.vendorCreateValidation = zod_1.z.object({
    vendorName: zod_1.z.string().min(1, 'Vendor name is required'),
    businessType: zod_1.z.string().min(1, 'Business type is required'),
    gstNumber: zod_1.z.string().optional(),
    country: zod_1.z.string().min(1, 'Country is required').default('IN'),
    address: zod_1.z.string().min(1, 'Address is required'),
    email: zod_1.z.string().email('Valid email is required'),
    phone: zod_1.z.string().min(5, 'Phone is required'),
});
exports.vendorDecisionValidation = zod_1.z.object({
    decision: zod_1.z.enum(['approve', 'reject']),
    rejectionReason: zod_1.z.string().min(1).optional(),
});
