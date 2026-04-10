import { z } from 'zod';

const INDIA_PHONE_REGEX = /^(?:\+?91)?[6-9]\d{9}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const vendorCreateValidation = z.object({
  vendorName: z.string().min(1, 'Vendor name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  gstNumber: z.string().optional().transform(v => v?.trim().toUpperCase() || '').refine(
    (val) => !val || GST_REGEX.test(val),
    { message: 'Invalid GST number format (e.g. 27ABCDE1234F1Z5)' }
  ),
  country: z.string().min(1, 'Country is required').default('IN'),
  address: z.string().min(1, 'Address is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone is required'),
}).superRefine((data, ctx) => {
  if (data.country === 'IN') {
    if (!INDIA_PHONE_REGEX.test(data.phone.replace(/\s/g, ''))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: 'Invalid Indian mobile number (10 digits starting with 6–9)',
      });
    }
  } else {
    const digits = data.phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: 'Phone number must be 7–15 digits',
      });
    }
  }
});

export const vendorDecisionValidation = z.object({
  decision: z.enum(['approve', 'reject']),
  rejectionReason: z.string().min(1).optional(),
});
