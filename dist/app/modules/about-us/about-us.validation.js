"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AboutUsValidation = void 0;
const zod_1 = require("zod");
exports.AboutUsValidation = zod_1.z.object({
    content: zod_1.z.string().min(1, 'About Us content is required')
});
