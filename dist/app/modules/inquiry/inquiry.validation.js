"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquiryUpdateValidation = exports.inquiryCreateValidation = void 0;
const zod_1 = require("zod");
exports.inquiryCreateValidation = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Valid email is required'),
    phone: zod_1.z.string().min(5, 'Phone is required'),
    purpose: zod_1.z.string().min(1, 'Purpose is required'),
    message: zod_1.z.string().min(1, 'Message is required'),
});
exports.inquiryUpdateValidation = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').optional(),
    email: zod_1.z.string().email('Valid email is required').optional(),
    phone: zod_1.z.string().min(5, 'Phone is required').optional(),
    purpose: zod_1.z.string().min(1, 'Purpose is required').optional(),
    message: zod_1.z.string().min(1, 'Message is required').optional(),
});
