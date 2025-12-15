import { z } from 'zod';

export const vendorCreateValidation = z.object({
  vendorName: z.string().min(1, 'Vendor name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  gstNumber: z.string().optional(),
  country: z.string().min(1, 'Country is required').default('IN'),
  address: z.string().min(1, 'Address is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone is required'),
});

export const vendorDecisionValidation = z.object({
  decision: z.enum(['approve', 'reject']),
  rejectionReason: z.string().min(1).optional(),
});
