"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerTermsValidation = void 0;
const zod_1 = require("zod");
exports.PartnerTermsValidation = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Partner Terms and Conditions content is required')
});
