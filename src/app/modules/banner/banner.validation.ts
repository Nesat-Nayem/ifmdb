import { z } from 'zod';

export const BANNER_TYPES = ['home', 'film_mart', 'events', 'watch_movies'] as const;
export const BANNER_PLATFORMS = ['web', 'mobile', 'both'] as const;

export const bannerValidation = z.object({
  title: z.string().min(1, 'Banner title is required'),
  image: z.string().min(1, 'Image is required'),
  bannerType: z.enum(BANNER_TYPES).optional().default('home'),
  platform: z.enum(BANNER_PLATFORMS).optional().default('both'),
  isActive: z.boolean().optional(),
  order: z.number().optional()
});

export const bannerUpdateValidation = z.object({
  title: z.string().min(1, 'Banner title is required').optional(),
  image: z.string().min(1, 'Image is required').optional(),
  bannerType: z.enum(BANNER_TYPES).optional(),
  platform: z.enum(BANNER_PLATFORMS).optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional()
});


