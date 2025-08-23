import { z } from 'zod';

export const helpCenterValidation = z.object({
  content: z.string().min(1, 'Content is required'),
});
