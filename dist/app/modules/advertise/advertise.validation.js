"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advertiseUpdateValidation = exports.advertiseCreateValidation = void 0;
const zod_1 = require("zod");
exports.advertiseCreateValidation = zod_1.z.object({
    status: zod_1.z.enum(['active', 'inactive']).optional(),
    image: zod_1.z.string().url('Image must be a valid URL'),
    link: zod_1.z.string().url('Link must be a valid URL').optional(),
});
exports.advertiseUpdateValidation = zod_1.z.object({
    status: zod_1.z.enum(['active', 'inactive']).optional(),
    image: zod_1.z.string().url('Image must be a valid URL').optional(),
    link: zod_1.z.string().url('Link must be a valid URL').optional(),
});
