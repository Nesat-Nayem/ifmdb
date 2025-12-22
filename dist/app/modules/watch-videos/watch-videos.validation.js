"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchVideoValidation = void 0;
const zod_1 = require("zod");
// Country Pricing Schema
const countryPricingSchema = zod_1.z.object({
    countryCode: zod_1.z.string().min(2).max(3),
    countryName: zod_1.z.string().min(1),
    currency: zod_1.z.string().min(3).max(3).default('INR'),
    price: zod_1.z.number().min(0),
    isActive: zod_1.z.boolean().default(true),
});
// Episode Schema
const episodeSchema = zod_1.z.object({
    episodeNumber: zod_1.z.number().min(1),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    videoUrl: zod_1.z.string().url(),
    thumbnailUrl: zod_1.z.string().optional(),
    duration: zod_1.z.number().min(0),
    releaseDate: zod_1.z.string().datetime().optional(),
    isActive: zod_1.z.boolean().default(true),
});
// Season Schema
const seasonSchema = zod_1.z.object({
    seasonNumber: zod_1.z.number().min(1),
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    episodes: zod_1.z.array(episodeSchema).default([]),
    releaseDate: zod_1.z.string().datetime().optional(),
    isActive: zod_1.z.boolean().default(true),
});
// Cast Schema
const castSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    role: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
});
// Crew Schema
const crewSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    designation: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
});
// ==================== CHANNEL VALIDATIONS ====================
const createChannelValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Channel name is required'),
        description: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
        bannerUrl: zod_1.z.string().optional(),
        socialLinks: zod_1.z.object({
            website: zod_1.z.string().optional(),
            youtube: zod_1.z.string().optional(),
            instagram: zod_1.z.string().optional(),
            twitter: zod_1.z.string().optional(),
            facebook: zod_1.z.string().optional(),
        }).optional(),
    }),
});
const updateChannelValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
        bannerUrl: zod_1.z.string().optional(),
        isVerified: zod_1.z.boolean().optional(),
        isActive: zod_1.z.boolean().optional(),
        socialLinks: zod_1.z.object({
            website: zod_1.z.string().optional(),
            youtube: zod_1.z.string().optional(),
            instagram: zod_1.z.string().optional(),
            twitter: zod_1.z.string().optional(),
            facebook: zod_1.z.string().optional(),
        }).optional(),
    }),
});
// ==================== WATCH VIDEO VALIDATIONS ====================
const createWatchVideoValidation = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        description: zod_1.z.string().min(1, 'Description is required'),
        channelId: zod_1.z.string().min(1, 'Channel ID is required'),
        videoType: zod_1.z.enum(['single', 'series']),
        category: zod_1.z.string().min(1, 'Category is required'),
        categoryId: zod_1.z.string().optional(),
        genres: zod_1.z.array(zod_1.z.string()).default([]),
        languages: zod_1.z.array(zod_1.z.string()).default([]),
        tags: zod_1.z.array(zod_1.z.string()).default([]),
        // For single video
        videoUrl: zod_1.z.string().optional(),
        trailerUrl: zod_1.z.string().optional(),
        // For series
        seasons: zod_1.z.array(seasonSchema).optional(),
        // Media
        thumbnailUrl: zod_1.z.string().min(1, 'Thumbnail is required'),
        posterUrl: zod_1.z.string().min(1, 'Poster is required'),
        backdropUrl: zod_1.z.string().optional(),
        galleryImages: zod_1.z.array(zod_1.z.string()).optional(),
        // Duration & Release
        duration: zod_1.z.number().min(0, 'Duration is required'),
        releaseDate: zod_1.z.string().min(1, 'Release date is required'),
        // Pricing
        isFree: zod_1.z.boolean().default(false),
        defaultPrice: zod_1.z.number().min(0).default(0),
        countryPricing: zod_1.z.array(countryPricingSchema).default([]),
        // Certification
        ageRating: zod_1.z.enum(['U', 'UA', 'A', 'S', 'G', 'PG', 'PG-13', 'R', 'NC-17']).default('U'),
        certification: zod_1.z.string().optional(),
        // Cast & Crew
        director: zod_1.z.string().optional(),
        producer: zod_1.z.string().optional(),
        cast: zod_1.z.array(castSchema).default([]),
        crew: zod_1.z.array(crewSchema).default([]),
        // Status
        status: zod_1.z.enum(['draft', 'published', 'archived']).default('draft'),
        isFeatured: zod_1.z.boolean().default(false),
        // Ownership
        uploadedBy: zod_1.z.string().min(1, 'Uploader ID is required'),
        uploadedByType: zod_1.z.enum(['admin', 'vendor']),
    }),
});
const updateWatchVideoValidation = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().min(1).optional(),
        channelId: zod_1.z.string().optional(),
        videoType: zod_1.z.enum(['single', 'series']).optional(),
        category: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().optional(),
        genres: zod_1.z.array(zod_1.z.string()).optional(),
        languages: zod_1.z.array(zod_1.z.string()).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        videoUrl: zod_1.z.string().optional(),
        trailerUrl: zod_1.z.string().optional(),
        seasons: zod_1.z.array(seasonSchema).optional(),
        thumbnailUrl: zod_1.z.string().optional(),
        posterUrl: zod_1.z.string().optional(),
        backdropUrl: zod_1.z.string().optional(),
        galleryImages: zod_1.z.array(zod_1.z.string()).optional(),
        duration: zod_1.z.number().min(0).optional(),
        releaseDate: zod_1.z.string().optional(),
        isFree: zod_1.z.boolean().optional(),
        defaultPrice: zod_1.z.number().min(0).optional(),
        countryPricing: zod_1.z.array(countryPricingSchema).optional(),
        ageRating: zod_1.z.enum(['U', 'UA', 'A', 'S', 'G', 'PG', 'PG-13', 'R', 'NC-17']).optional(),
        certification: zod_1.z.string().optional(),
        director: zod_1.z.string().optional(),
        producer: zod_1.z.string().optional(),
        cast: zod_1.z.array(castSchema).optional(),
        crew: zod_1.z.array(crewSchema).optional(),
        status: zod_1.z.enum(['draft', 'published', 'archived']).optional(),
        isActive: zod_1.z.boolean().optional(),
        isFeatured: zod_1.z.boolean().optional(),
        homeSection: zod_1.z.string().optional(),
        rentalDays: zod_1.z.number().min(0).optional(),
    }),
});
const getWatchVideosValidation = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().optional(),
        channelId: zod_1.z.string().optional(),
        videoType: zod_1.z.enum(['single', 'series']).optional(),
        genre: zod_1.z.string().optional(),
        language: zod_1.z.string().optional(),
        status: zod_1.z.enum(['draft', 'published', 'archived']).optional(),
        isFree: zod_1.z.string().optional(),
        isFeatured: zod_1.z.string().optional(),
        minPrice: zod_1.z.string().optional(),
        maxPrice: zod_1.z.string().optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
        uploadedBy: zod_1.z.string().optional(),
    }),
});
// ==================== CATEGORY VALIDATIONS ====================
const createCategoryValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Category name is required'),
        description: zod_1.z.string().optional(),
        imageUrl: zod_1.z.string().optional(),
        iconUrl: zod_1.z.string().optional(),
        parentId: zod_1.z.string().optional(),
        order: zod_1.z.number().default(0),
    }),
});
const updateCategoryValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional(),
        imageUrl: zod_1.z.string().optional(),
        iconUrl: zod_1.z.string().optional(),
        parentId: zod_1.z.string().optional(),
        order: zod_1.z.number().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
// ==================== EPISODE/SEASON VALIDATIONS ====================
const addEpisodeValidation = zod_1.z.object({
    body: episodeSchema,
});
const addSeasonValidation = zod_1.z.object({
    body: seasonSchema,
});
// ==================== REVIEW VALIDATIONS ====================
const addReviewValidation = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
        rating: zod_1.z.number().min(1).max(10),
        reviewText: zod_1.z.string().optional(),
    }),
});
// ==================== SUBSCRIPTION VALIDATIONS ====================
const subscribeValidation = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
    }),
});
// ==================== WATCH HISTORY VALIDATIONS ====================
const updateWatchProgressValidation = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
        watchedDuration: zod_1.z.number().min(0),
        totalDuration: zod_1.z.number().min(1),
        episodeId: zod_1.z.string().optional(),
        seasonNumber: zod_1.z.number().optional(),
        episodeNumber: zod_1.z.number().optional(),
    }),
});
// ==================== PAYMENT VALIDATIONS ====================
const createPaymentOrderValidation = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
        purchaseType: zod_1.z.enum(['rent', 'buy']).default('buy'),
        countryCode: zod_1.z.string().default('IN'),
        customerDetails: zod_1.z.object({
            name: zod_1.z.string().min(1, 'Customer name is required'),
            email: zod_1.z.string().email('Valid email is required'),
            phone: zod_1.z.string().min(10, 'Valid phone number is required'),
        }),
        returnUrl: zod_1.z.string().optional(),
    }),
});
const initiateRefundValidation = zod_1.z.object({
    body: zod_1.z.object({
        reason: zod_1.z.string().optional(),
    }),
});
exports.WatchVideoValidation = {
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
