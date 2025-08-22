import { z } from 'zod';

export const onboardingCreateValidation = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  image: z.string().min(1, 'Image is required'),
  status: z.enum(['active', 'inactive']).optional(),
  metaTitle: z.string().optional(),
  metaTags: z.array(z.string()).optional(),
  metaDescription: z.string().optional(),
});

export const onboardingUpdateValidation = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  subtitle: z.string().optional(),
  image: z.string().min(1, 'Image is required').optional(),
  status: z.enum(['active', 'inactive']).optional(),
  metaTitle: z.string().optional(),
  metaTags: z.array(z.string()).optional(),
  metaDescription: z.string().optional(),
});
