import { z } from 'zod';

export const subscriptionPlanCreateValidation = z.object({
  planName: z.string().min(1, 'Plan name is required'),
  planCost: z.number().nonnegative('Plan cost must be >= 0'),
  planInclude: z.array(z.string()).min(1, 'At least one included item is required'),
  metaTitle: z.string().optional(),
  metaTag: z.array(z.string()).optional(),
  metaDescription: z.string().optional(),
});

export const subscriptionPlanUpdateValidation = z.object({
  planName: z.string().min(1).optional(),
  planCost: z.number().nonnegative().optional(),
  planInclude: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaTag: z.array(z.string()).optional(),
  metaDescription: z.string().optional(),
});
