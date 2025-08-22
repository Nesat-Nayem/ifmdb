import { z } from 'zod';

export const inquiryCreateValidation = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  message: z.string().min(1, 'Message is required'),
});

export const inquiryUpdateValidation = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().min(5, 'Phone is required').optional(),
  purpose: z.string().min(1, 'Purpose is required').optional(),
  message: z.string().min(1, 'Message is required').optional(),
});
