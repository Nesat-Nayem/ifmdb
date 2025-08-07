"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieValidation = void 0;
const zod_1 = require("zod");
// Cast and Crew validation schema
const castCrewSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    role: zod_1.z.enum(['actor', 'actress', 'director', 'producer', 'writer', 'cinematographer', 'music_director', 'editor', 'other']),
    characterName: zod_1.z.string().optional(),
    profileImage: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
    isMainCast: zod_1.z.boolean().optional()
});
// Review validation schema
const reviewSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    userName: zod_1.z.string().min(1, 'User name is required'),
    userImage: zod_1.z.string().optional(),
    rating: zod_1.z.number().min(1, 'Rating must be at least 1').max(10, 'Rating cannot exceed 10'),
    reviewText: zod_1.z.string().min(1, 'Review text is required'),
    isVerified: zod_1.z.boolean().optional(),
    helpfulCount: zod_1.z.number().optional()
});
// Create movie validation
const createMovieValidation = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Movie title is required'),
        originalTitle: zod_1.z.string().optional(),
        description: zod_1.z.string().min(1, 'Movie description is required'),
        releaseDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid release date format'
        }),
        duration: zod_1.z.number().min(1, 'Duration must be at least 1 minute'),
        genres: zod_1.z.array(zod_1.z.string().min(1, 'Genre cannot be empty')).min(1, 'At least one genre is required'),
        languages: zod_1.z.array(zod_1.z.string().min(1, 'Language cannot be empty')).min(1, 'At least one language is required'),
        originalLanguage: zod_1.z.string().min(1, 'Original language is required'),
        rating: zod_1.z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR']).optional(),
        imdbRating: zod_1.z.number().min(0).max(10).optional(),
        rottenTomatoesRating: zod_1.z.number().min(0).max(100).optional(),
        posterUrl: zod_1.z.string().min(1, 'Poster URL is required'),
        backdropUrl: zod_1.z.string().optional(),
        trailerUrl: zod_1.z.string().optional(),
        galleryImages: zod_1.z.array(zod_1.z.string()).optional(),
        budget: zod_1.z.number().min(0).optional(),
        boxOffice: zod_1.z.number().min(0).optional(),
        country: zod_1.z.string().min(1, 'Country is required'),
        productionCompanies: zod_1.z.array(zod_1.z.string()).optional(),
        distributors: zod_1.z.array(zod_1.z.string()).optional(),
        castCrew: zod_1.z.array(castCrewSchema).optional(),
        formats: zod_1.z.array(zod_1.z.enum(['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema', 'ScreenX'])).optional(),
        status: zod_1.z.enum(['upcoming', 'released', 'in_production']).optional(),
        isActive: zod_1.z.boolean().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        awards: zod_1.z.array(zod_1.z.string()).optional()
    })
});
// Update movie validation
const updateMovieValidation = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Movie title is required').optional(),
        originalTitle: zod_1.z.string().optional(),
        description: zod_1.z.string().min(1, 'Movie description is required').optional(),
        releaseDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid release date format'
        }).optional(),
        duration: zod_1.z.number().min(1, 'Duration must be at least 1 minute').optional(),
        genres: zod_1.z.array(zod_1.z.string().min(1, 'Genre cannot be empty')).min(1, 'At least one genre is required').optional(),
        languages: zod_1.z.array(zod_1.z.string().min(1, 'Language cannot be empty')).min(1, 'At least one language is required').optional(),
        originalLanguage: zod_1.z.string().min(1, 'Original language is required').optional(),
        rating: zod_1.z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR']).optional(),
        imdbRating: zod_1.z.number().min(0).max(10).optional(),
        rottenTomatoesRating: zod_1.z.number().min(0).max(100).optional(),
        posterUrl: zod_1.z.string().min(1, 'Poster URL is required').optional(),
        backdropUrl: zod_1.z.string().optional(),
        trailerUrl: zod_1.z.string().optional(),
        galleryImages: zod_1.z.array(zod_1.z.string()).optional(),
        budget: zod_1.z.number().min(0).optional(),
        boxOffice: zod_1.z.number().min(0).optional(),
        country: zod_1.z.string().min(1, 'Country is required').optional(),
        productionCompanies: zod_1.z.array(zod_1.z.string()).optional(),
        distributors: zod_1.z.array(zod_1.z.string()).optional(),
        castCrew: zod_1.z.array(castCrewSchema).optional(),
        formats: zod_1.z.array(zod_1.z.enum(['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema', 'ScreenX'])).optional(),
        status: zod_1.z.enum(['upcoming', 'released', 'in_production']).optional(),
        isActive: zod_1.z.boolean().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        awards: zod_1.z.array(zod_1.z.string()).optional()
    })
});
// Add review validation
const addReviewValidation = zod_1.z.object({
    body: reviewSchema
});
// Get movies query validation
const getMoviesValidation = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        genre: zod_1.z.string().optional(),
        language: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        status: zod_1.z.enum(['upcoming', 'released', 'in_production']).optional(),
        rating: zod_1.z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR']).optional(),
        releaseYear: zod_1.z.string().optional(),
        minRating: zod_1.z.string().optional(),
        maxRating: zod_1.z.string().optional(),
        format: zod_1.z.enum(['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema', 'ScreenX']).optional(),
        sortBy: zod_1.z.enum(['title', 'releaseDate', 'imdbRating', 'averageRating', 'createdAt']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
    })
});
exports.MovieValidation = {
    createMovieValidation,
    updateMovieValidation,
    addReviewValidation,
    getMoviesValidation
};
