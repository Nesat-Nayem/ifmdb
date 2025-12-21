import { z } from 'zod';

// Country Pricing Schema
const countryPricingSchema = z.object({
  countryCode: z.string().min(2).max(3),
  countryName: z.string().min(1),
  currency: z.string().min(3).max(3).default('INR'),
  price: z.number().min(0),
  isActive: z.boolean().default(true),
});

// Episode Schema
const episodeSchema = z.object({
  episodeNumber: z.number().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().min(0),
  releaseDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

// Season Schema
const seasonSchema = z.object({
  seasonNumber: z.number().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  episodes: z.array(episodeSchema).default([]),
  releaseDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

// Cast Schema
const castSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  image: z.string().optional(),
});

// Crew Schema
const crewSchema = z.object({
  name: z.string().min(1),
  designation: z.string().optional(),
  image: z.string().optional(),
});

// ==================== CHANNEL VALIDATIONS ====================

const createChannelValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Channel name is required'),
    description: z.string().optional(),
    logoUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    socialLinks: z.object({
      website: z.string().optional(),
      youtube: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      facebook: z.string().optional(),
    }).optional(),
  }),
});

const updateChannelValidation = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    logoUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    isVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
    socialLinks: z.object({
      website: z.string().optional(),
      youtube: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      facebook: z.string().optional(),
    }).optional(),
  }),
});

// ==================== WATCH VIDEO VALIDATIONS ====================

const createWatchVideoValidation = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    channelId: z.string().min(1, 'Channel ID is required'),
    videoType: z.enum(['single', 'series']),
    category: z.string().min(1, 'Category is required'),
    categoryId: z.string().optional(),
    genres: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    
    // For single video
    videoUrl: z.string().optional(),
    trailerUrl: z.string().optional(),
    
    // For series
    seasons: z.array(seasonSchema).optional(),
    
    // Media
    thumbnailUrl: z.string().min(1, 'Thumbnail is required'),
    posterUrl: z.string().min(1, 'Poster is required'),
    backdropUrl: z.string().optional(),
    galleryImages: z.array(z.string()).optional(),
    
    // Duration & Release
    duration: z.number().min(0, 'Duration is required'),
    releaseDate: z.string().min(1, 'Release date is required'),
    
    // Pricing
    isFree: z.boolean().default(false),
    defaultPrice: z.number().min(0).default(0),
    countryPricing: z.array(countryPricingSchema).default([]),
    
    // Certification
    ageRating: z.enum(['U', 'UA', 'A', 'S', 'G', 'PG', 'PG-13', 'R', 'NC-17']).default('U'),
    certification: z.string().optional(),
    
    // Cast & Crew
    director: z.string().optional(),
    producer: z.string().optional(),
    cast: z.array(castSchema).default([]),
    crew: z.array(crewSchema).default([]),
    
    // Status
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    isFeatured: z.boolean().default(false),
    
    // Ownership
    uploadedBy: z.string().min(1, 'Uploader ID is required'),
    uploadedByType: z.enum(['admin', 'vendor']),
  }),
});

const updateWatchVideoValidation = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    channelId: z.string().optional(),
    videoType: z.enum(['single', 'series']).optional(),
    category: z.string().optional(),
    categoryId: z.string().optional(),
    genres: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    videoUrl: z.string().optional(),
    trailerUrl: z.string().optional(),
    seasons: z.array(seasonSchema).optional(),
    thumbnailUrl: z.string().optional(),
    posterUrl: z.string().optional(),
    backdropUrl: z.string().optional(),
    galleryImages: z.array(z.string()).optional(),
    duration: z.number().min(0).optional(),
    releaseDate: z.string().optional(),
    isFree: z.boolean().optional(),
    defaultPrice: z.number().min(0).optional(),
    countryPricing: z.array(countryPricingSchema).optional(),
    ageRating: z.enum(['U', 'UA', 'A', 'S', 'G', 'PG', 'PG-13', 'R', 'NC-17']).optional(),
    certification: z.string().optional(),
    director: z.string().optional(),
    producer: z.string().optional(),
    cast: z.array(castSchema).optional(),
    crew: z.array(crewSchema).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    homeSection: z.string().optional(),
    rentalDays: z.number().min(0).optional(),
  }),
});

const getWatchVideosValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    categoryId: z.string().optional(),
    channelId: z.string().optional(),
    videoType: z.enum(['single', 'series']).optional(),
    genre: z.string().optional(),
    language: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    isFree: z.string().optional(),
    isFeatured: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    uploadedBy: z.string().optional(),
  }),
});

// ==================== CATEGORY VALIDATIONS ====================

const createCategoryValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    iconUrl: z.string().optional(),
    parentId: z.string().optional(),
    order: z.number().default(0),
  }),
});

const updateCategoryValidation = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    iconUrl: z.string().optional(),
    parentId: z.string().optional(),
    order: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

// ==================== EPISODE/SEASON VALIDATIONS ====================

const addEpisodeValidation = z.object({
  body: episodeSchema,
});

const addSeasonValidation = z.object({
  body: seasonSchema,
});

// ==================== REVIEW VALIDATIONS ====================

const addReviewValidation = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    rating: z.number().min(1).max(10),
    reviewText: z.string().optional(),
  }),
});

// ==================== SUBSCRIPTION VALIDATIONS ====================

const subscribeValidation = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
});

// ==================== WATCH HISTORY VALIDATIONS ====================

const updateWatchProgressValidation = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    watchedDuration: z.number().min(0),
    totalDuration: z.number().min(1),
    episodeId: z.string().optional(),
    seasonNumber: z.number().optional(),
    episodeNumber: z.number().optional(),
  }),
});

// ==================== PAYMENT VALIDATIONS ====================

const createPaymentOrderValidation = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    purchaseType: z.enum(['rent', 'buy']).default('buy'),
    countryCode: z.string().default('IN'),
    customerDetails: z.object({
      name: z.string().min(1, 'Customer name is required'),
      email: z.string().email('Valid email is required'),
      phone: z.string().min(10, 'Valid phone number is required'),
    }),
    returnUrl: z.string().optional(),
  }),
});

const initiateRefundValidation = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
});

export const WatchVideoValidation = {
  // Channel
  createChannelValidation,
  updateChannelValidation,
  
  // Watch Videos
  createWatchVideoValidation,
  updateWatchVideoValidation,
  getWatchVideosValidation,
  
  // Categories
  createCategoryValidation,
  updateCategoryValidation,
  
  // Episodes/Seasons
  addEpisodeValidation,
  addSeasonValidation,
  
  // Reviews
  addReviewValidation,
  
  // Subscription
  subscribeValidation,
  
  // Watch History
  updateWatchProgressValidation,
  
  // Payment
  createPaymentOrderValidation,
  initiateRefundValidation,
};
