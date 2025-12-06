"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalSettingsValidation = void 0;
const zod_1 = require("zod");
// Helper for optional URL that also allows empty string
const optionalUrl = zod_1.z.string().optional().refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), { message: 'Invalid URL' });
exports.generalSettingsValidation = zod_1.z.object({
    number: zod_1.z.string().optional(),
    email: zod_1.z.union([zod_1.z.string().email('Invalid email'), zod_1.z.literal('')]).optional(),
    facebook: optionalUrl,
    instagram: optionalUrl,
    linkedin: optionalUrl,
    twitter: optionalUrl,
    youtube: optionalUrl,
    // Note: favicon and logo are handled separately via file upload
    // They are not validated here as they come from Cloudinary after upload
});
