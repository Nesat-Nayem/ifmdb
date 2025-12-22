import { z } from 'zod';

export const CancellationRefundValidation = z.object({
  content: z.string().min(1, 'Cancellation & Refund Policy content is required')
});
