"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionPlanUpdateValidation = exports.subscriptionPlanCreateValidation = void 0;
const zod_1 = require("zod");
exports.subscriptionPlanCreateValidation = zod_1.z.object({
    planName: zod_1.z.string().min(1, 'Plan name is required'),
    planCost: zod_1.z.number().nonnegative('Plan cost must be >= 0'),
    planInclude: zod_1.z.array(zod_1.z.string()).min(1, 'At least one included item is required'),
    metaTitle: zod_1.z.string().optional(),
    metaTag: zod_1.z.array(zod_1.z.string()).optional(),
    metaDescription: zod_1.z.string().optional(),
});
exports.subscriptionPlanUpdateValidation = zod_1.z.object({
    planName: zod_1.z.string().min(1).optional(),
    planCost: zod_1.z.number().nonnegative().optional(),
    planInclude: zod_1.z.array(zod_1.z.string()).optional(),
    metaTitle: zod_1.z.string().optional(),
    metaTag: zod_1.z.array(zod_1.z.string()).optional(),
    metaDescription: zod_1.z.string().optional(),
});
