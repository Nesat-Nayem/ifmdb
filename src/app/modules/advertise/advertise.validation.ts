import { z } from 'zod';

export const advertiseCreateValidation = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  image: z.string().url('Image must be a valid URL'),
  link: z.string().url('Link must be a valid URL').optional(),
});

export const advertiseUpdateValidation = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  link: z.string().url('Link must be a valid URL').optional(),
});
