"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorDecisionValidation = exports.vendorCreateValidation = void 0;
const zod_1 = require("zod");
const INDIA_PHONE_REGEX = /^(?:\+?91)?[6-9]\d{9}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
exports.vendorCreateValidation = zod_1.z.object({
    vendorName: zod_1.z.string().min(1, 'Vendor name is required'),
    businessType: zod_1.z.string().min(1, 'Business type is required'),
    gstNumber: zod_1.z.string().optional().transform(v => (v === null || v === void 0 ? void 0 : v.trim().toUpperCase()) || '').refine((val) => !val || GST_REGEX.test(val), { message: 'Invalid GST number format (e.g. 27ABCDE1234F1Z5)' }),
    country: zod_1.z.string().min(1, 'Country is required').default('IN'),
    address: zod_1.z.string().min(1, 'Address is required'),
    email: zod_1.z.string().email('Valid email is required'),
    phone: zod_1.z.string().min(5, 'Phone is required'),
}).superRefine((data, ctx) => {
    if (data.country === 'IN') {
        if (!INDIA_PHONE_REGEX.test(data.phone.replace(/\s/g, ''))) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['phone'],
                message: 'Invalid Indian mobile number (10 digits starting with 6–9)',
            });
        }
    }
    else {
        const digits = data.phone.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['phone'],
                message: 'Phone number must be 7–15 digits',
            });
        }
    }
});
exports.vendorDecisionValidation = zod_1.z.object({
    decision: zod_1.z.enum(['approve', 'reject']),
    rejectionReason: zod_1.z.string().min(1).optional(),
});
