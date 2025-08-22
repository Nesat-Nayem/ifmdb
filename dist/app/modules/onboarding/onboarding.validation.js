"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingUpdateValidation = exports.onboardingCreateValidation = void 0;
const zod_1 = require("zod");
exports.onboardingCreateValidation = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    subtitle: zod_1.z.string().optional(),
    image: zod_1.z.string().min(1, 'Image is required'),
    status: zod_1.z.enum(['active', 'inactive']).optional(),
    metaTitle: zod_1.z.string().optional(),
    metaTags: zod_1.z.array(zod_1.z.string()).optional(),
    metaDescription: zod_1.z.string().optional(),
});
exports.onboardingUpdateValidation = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').optional(),
    subtitle: zod_1.z.string().optional(),
    image: zod_1.z.string().min(1, 'Image is required').optional(),
    status: zod_1.z.enum(['active', 'inactive']).optional(),
    metaTitle: zod_1.z.string().optional(),
    metaTags: zod_1.z.array(zod_1.z.string()).optional(),
    metaDescription: zod_1.z.string().optional(),
});
