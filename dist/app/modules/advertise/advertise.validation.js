"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advertiseUpdateValidation = exports.advertiseCreateValidation = void 0;
const zod_1 = require("zod");
exports.advertiseCreateValidation = zod_1.z.object({
    status: zod_1.z.enum(['active', 'inactive']).optional(),
    image: zod_1.z.string().url('Image must be a valid URL'),
});
exports.advertiseUpdateValidation = zod_1.z.object({
    status: zod_1.z.enum(['active', 'inactive']).optional(),
    image: zod_1.z.string().url('Image must be a valid URL').optional(),
});
