import { z } from 'zod';

export const ContactUsValidation = z.object({
  content: z.string().min(1, 'Contact Us content is required')
});
