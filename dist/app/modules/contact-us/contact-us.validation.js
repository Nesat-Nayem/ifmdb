"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactUsValidation = void 0;
const zod_1 = require("zod");
exports.ContactUsValidation = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Contact Us content is required')
});
