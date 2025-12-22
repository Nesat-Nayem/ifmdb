import { z } from 'zod';

export const AboutUsValidation = z.object({
  content: z.string().min(1, 'About Us content is required')
});
