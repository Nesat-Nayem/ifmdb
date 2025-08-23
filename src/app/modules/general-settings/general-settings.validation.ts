import { z } from 'zod';

export const generalSettingsValidation = z.object({
  number: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  facebook: z.string().url('Invalid URL').optional(),
  instagram: z.string().url('Invalid URL').optional(),
  linkedin: z.string().url('Invalid URL').optional(),
  twitter: z.string().url('Invalid URL').optional(),
  youtube: z.string().url('Invalid URL').optional(),
  favicon: z.string().url('Invalid URL').optional(),
  logo: z.string().url('Invalid URL').optional(),
});
