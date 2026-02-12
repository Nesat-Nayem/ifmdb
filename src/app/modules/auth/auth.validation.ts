import { z } from "zod";

// International phone validation: digits only, 7-15 digits (E.164 without '+')
// Accepts phone numbers with country code, e.g. "8801617660907" (BD), "919876543210" (IN)
const internationalPhoneRegex = /^\d{7,15}$/;

// Function to validate international phone number (digits only with country code)
const validatePhone = (phone: string) => {
  // Remove any '+' prefix, spaces, dashes
  let cleanedPhone = phone.replace(/[\s\-\+]/g, '').trim();
  
  if (!internationalPhoneRegex.test(cleanedPhone)) {
    throw new Error("Invalid phone number. Please provide your full phone number with country code (digits only, 7-15 digits).");
  }
  
  return cleanedPhone;
};

// Optional phone validation - only validates if phone is provided and not empty
const optionalPhone = z.string().optional().transform((val) => {
  // If empty or undefined, return undefined (skip validation)
  if (!val || val.trim() === '') {
    return undefined;
  }
  const cleanedPhone = val.replace(/[\s\-\+]/g, '').trim();
  if (!internationalPhoneRegex.test(cleanedPhone)) {
    throw new Error("Invalid phone number. Please provide your full phone number with country code (digits only, 7-15 digits).");
  }
  return cleanedPhone;
});

export const authValidation = z.object({
  name: z.string(),
  password: z.string().min(6),
  phone: optionalPhone,
  email: z.string().email("Invalid email format"),
  img: z.string().optional(),
  role: z.enum(['admin','vendor', 'user']).default('user').optional()
});

export const loginValidation = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
});

export const resetPasswordValidation = z.object({
  phone: z.string().refine(validatePhone, {
    message: "Invalid phone number. Please provide your full phone number with country code."
  }),
  newPassword: z.string().min(6)
});

export const activateUserValidation = z.object({
  phone: z.string().refine(validatePhone, {
    message: "Invalid phone number. Please provide your full phone number with country code."
  })
});

export const phoneCheckValidation = z.object({
  phone: z.string().refine(validatePhone, {
    message: "Invalid phone number. Please provide your full phone number with country code."
  })
});

export const emailCheckValidation = z.object({
  email: z.string().email("Invalid email format")
});

export const updateUserValidation = z.object({
  name: z.string().optional(),
  phone: optionalPhone,
  email: z.union([
    z.string().email("Invalid email format"),
    z.string().length(0) // Allow empty string
  ]).optional(),
  img: z.string().optional(),
  role: z.enum(['admin','vendor', 'user']).optional(),
});



export const requestOtpValidation = z.object({
  phone: z.string().refine(validatePhone, {
    message: "Invalid phone number. Please provide your full phone number with country code."
  })
});

export const verifyOtpValidation = z.object({
  phone: z.string().refine(validatePhone, {
    message: "Invalid phone number. Please provide your full phone number with country code."
  }),
  otp: z.string().length(6, "OTP must be 6 digits")
});

// Google Auth validation
export const googleAuthValidation = z.object({
  idToken: z.string().min(1, "Firebase ID token is required")
});

// Apple Auth validation
export const appleAuthValidation = z.object({
  idToken: z.string().min(1, "Apple ID token is required"),
  userIdentifier: z.string().nullable().optional(),
  authorizationCode: z.string().optional(),
  fullName: z.object({
    givenName: z.string().nullable().optional(),
    familyName: z.string().nullable().optional()
  }).optional(),
  email: z.string().email().nullable().optional()
});

