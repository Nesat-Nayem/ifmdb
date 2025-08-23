"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalSettingsValidation = void 0;
const zod_1 = require("zod");
exports.generalSettingsValidation = zod_1.z.object({
    number: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Invalid email').optional(),
    facebook: zod_1.z.string().url('Invalid URL').optional(),
    instagram: zod_1.z.string().url('Invalid URL').optional(),
    linkedin: zod_1.z.string().url('Invalid URL').optional(),
    twitter: zod_1.z.string().url('Invalid URL').optional(),
    youtube: zod_1.z.string().url('Invalid URL').optional(),
    favicon: zod_1.z.string().url('Invalid URL').optional(),
    logo: zod_1.z.string().url('Invalid URL').optional(),
});
