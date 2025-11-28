import { z } from 'zod';

// Create event category validation
const createEventCategoryValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    image: z.string().optional(),
    isMusicShow: z.boolean().optional().default(false),
    isComedyShow: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true)
  })
});

// Update event category validation
const updateEventCategoryValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').optional(),
    image: z.string().optional(),
    isMusicShow: z.boolean().optional(),
    isComedyShow: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
});

// Get event categories query validation
const getEventCategoriesValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    isMusicShow: z.string().optional(),
    isComedyShow: z.string().optional(),
    isActive: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt', 'eventCount']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

export const EventCategoryValidation = {
  createEventCategoryValidation,
  updateEventCategoryValidation,
  getEventCategoriesValidation
};
