import { z } from 'zod';

// Helper for optional URL that also allows empty string
const optionalUrl = z.string().optional().refine(
  (val) => !val || val === '' || /^https?:\/\/.+/.test(val),
  { message: 'Invalid URL' }
);

export const generalSettingsValidation = z.object({
  number: z.string().optional(),
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  facebook: optionalUrl,
  instagram: optionalUrl,
  linkedin: optionalUrl,
  twitter: optionalUrl,
  youtube: optionalUrl,
  // Note: favicon and logo are handled separately via file upload
  // They are not validated here as they come from Cloudinary after upload
});
