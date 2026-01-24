"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appleAuthValidation = exports.googleAuthValidation = exports.verifyOtpValidation = exports.requestOtpValidation = exports.updateUserValidation = exports.emailCheckValidation = exports.phoneCheckValidation = exports.activateUserValidation = exports.resetPasswordValidation = exports.loginValidation = exports.authValidation = void 0;
const zod_1 = require("zod");
// Regex for Indian mobile numbers
// Must start with 6, 7, 8, or 9 and be followed by 9 digits
const indianMobileRegex = /^[6-9]\d{9}$/;
// Function to validate and format Indian mobile number
const validateIndianMobile = (phone) => {
    // Remove country code +91 or 0 prefix if present
    let cleanedPhone = phone.replace(/^(\+91|0)/, '').trim();
    if (!indianMobileRegex.test(cleanedPhone)) {
        throw new Error("Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9");
    }
    return cleanedPhone;
};
exports.authValidation = zod_1.z.object({
    name: zod_1.z.string(),
    password: zod_1.z.string().min(6),
    phone: zod_1.z.string().refine(validateIndianMobile, {
        message: "Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9"
    }).optional().or(zod_1.z.literal('')),
    email: zod_1.z.string().email("Invalid email format"),
    img: zod_1.z.string().optional(),
    role: zod_1.z.enum(['admin', 'vendor', 'user']).default('user').optional()
});
exports.loginValidation = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string()
});
exports.resetPasswordValidation = zod_1.z.object({
    phone: zod_1.z.string().refine(validateIndianMobile, {
        message: "Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9"
    }),
    newPassword: zod_1.z.string().min(6)
});
exports.activateUserValidation = zod_1.z.object({
    phone: zod_1.z.string().refine(validateIndianMobile, {
        message: "Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9"
    })
});
exports.phoneCheckValidation = zod_1.z.object({
    phone: zod_1.z.string().refine(validateIndianMobile, {
        message: "Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9"
    })
});
exports.emailCheckValidation = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format")
});
exports.updateUserValidation = zod_1.z.object({
    name: zod_1.z.string().optional(),
    phone: zod_1.z.string().refine(validateIndianMobile, {
        message: "Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9"
    }).optional(),
    email: zod_1.z.union([
        zod_1.z.string().email("Invalid email format"),
        zod_1.z.string().length(0) // Allow empty string
    ]).optional(),
    img: zod_1.z.string().optional(),
    role: zod_1.z.enum(['admin', 'vendor', 'user']).optional(),
});
exports.requestOtpValidation = zod_1.z.object({
    phone: zod_1.z.string().refine(validateIndianMobile, {
        message: "Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9"
    })
});
exports.verifyOtpValidation = zod_1.z.object({
    phone: zod_1.z.string().refine(validateIndianMobile, {
        message: "Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9"
    }),
    otp: zod_1.z.string().length(6, "OTP must be 6 digits")
});
// Google Auth validation
exports.googleAuthValidation = zod_1.z.object({
    idToken: zod_1.z.string().min(1, "Firebase ID token is required")
});
// Apple Auth validation
exports.appleAuthValidation = zod_1.z.object({
    idToken: zod_1.z.string().min(1, "Apple ID token is required"),
    userIdentifier: zod_1.z.string().nullable().optional(),
    authorizationCode: zod_1.z.string().optional(),
    fullName: zod_1.z.object({
        givenName: zod_1.z.string().nullable().optional(),
        familyName: zod_1.z.string().nullable().optional()
    }).optional(),
    email: zod_1.z.string().email().nullable().optional()
});
