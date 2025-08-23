import { z } from 'zod';

export const advertiseCreateValidation = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  image: z.string().url('Image must be a valid URL'),
});

export const advertiseUpdateValidation = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  image: z.string().url('Image must be a valid URL').optional(),
});
