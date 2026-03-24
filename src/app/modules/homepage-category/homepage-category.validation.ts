import { z } from 'zod';

export const homepageCategoryValidation = z.object({
  title: z.string().min(1, 'Category title is required'),
  image: z.string().min(1, 'Image is required'),
  link: z.string().optional().default(''),
  isActive: z.boolean().optional(),
  order: z.number().optional()
});

export const homepageCategoryUpdateValidation = z.object({
  title: z.string().min(1, 'Category title is required').optional(),
  image: z.string().min(1, 'Image is required').optional(),
  link: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional()
});
