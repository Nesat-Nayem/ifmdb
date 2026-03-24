"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.homepageCategoryUpdateValidation = exports.homepageCategoryValidation = void 0;
const zod_1 = require("zod");
exports.homepageCategoryValidation = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Category title is required'),
    image: zod_1.z.string().min(1, 'Image is required'),
    link: zod_1.z.string().optional().default(''),
    isActive: zod_1.z.boolean().optional(),
    order: zod_1.z.number().optional()
});
exports.homepageCategoryUpdateValidation = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Category title is required').optional(),
    image: zod_1.z.string().min(1, 'Image is required').optional(),
    link: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    order: zod_1.z.number().optional()
});
