"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannerUpdateValidation = exports.bannerValidation = exports.BANNER_PLATFORMS = exports.BANNER_TYPES = void 0;
const zod_1 = require("zod");
exports.BANNER_TYPES = ['home', 'film_mart', 'events', 'watch_movies'];
exports.BANNER_PLATFORMS = ['web', 'mobile', 'both'];
exports.bannerValidation = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Banner title is required'),
    image: zod_1.z.string().min(1, 'Image is required'),
    bannerType: zod_1.z.enum(exports.BANNER_TYPES).optional().default('home'),
    platform: zod_1.z.enum(exports.BANNER_PLATFORMS).optional().default('both'),
    isActive: zod_1.z.boolean().optional(),
    order: zod_1.z.number().optional()
});
exports.bannerUpdateValidation = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Banner title is required').optional(),
    image: zod_1.z.string().min(1, 'Image is required').optional(),
    bannerType: zod_1.z.enum(exports.BANNER_TYPES).optional(),
    platform: zod_1.z.enum(exports.BANNER_PLATFORMS).optional(),
    isActive: zod_1.z.boolean().optional(),
    order: zod_1.z.number().optional()
});
