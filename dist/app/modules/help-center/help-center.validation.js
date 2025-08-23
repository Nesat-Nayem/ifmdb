"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpCenterValidation = void 0;
const zod_1 = require("zod");
exports.helpCenterValidation = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Content is required'),
});
