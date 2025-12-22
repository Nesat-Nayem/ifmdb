import { z } from 'zod';

export const PartnerTermsValidation = z.object({
  content: z.string().min(1, 'Partner Terms and Conditions content is required')
});
