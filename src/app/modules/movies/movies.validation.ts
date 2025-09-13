import { z } from 'zod';

// Cast and Crew validation schema
const castCrewSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['actor', 'actress', 'director', 'producer', 'writer', 'cinematographer', 'music_director', 'editor', 'other']),
  characterName: z.string().optional(),
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  isMainCast: z.boolean().optional()
});

// Admin-panel simple cast schema
const simpleCastSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional(),
  image: z.string().optional(),
});

// Admin-panel simple crew schema
const simpleCrewSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.string().optional(),
  image: z.string().optional(),
});

// Company schema
const companySchema = z.object({
  productionHouse: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

// Review validation schema
const reviewSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  userName: z.string().min(1, 'User name is required'),
  userImage: z.string().optional(),
  rating: z.number().min(1, 'Rating must be at least 1').max(10, 'Rating cannot exceed 10'),
  reviewText: z.string().min(1, 'Review text is required'),
  isVerified: z.boolean().optional(),
  helpfulCount: z.number().optional()
});

// Create movie validation
const createMovieValidation = z.object({
  body: z.object({
    title: z.string().min(1, 'Movie title is required'),
    originalTitle: z.string().optional(),
    description: z.string().min(1, 'Movie description is required'),
    releaseDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid release date format'
    }),
    duration: z.number().min(1, 'Duration must be at least 1 minute'),
    genres: z.array(z.string().min(1, 'Genre cannot be empty')).min(1, 'At least one genre is required'),
    languages: z.array(z.string().min(1, 'Language cannot be empty')).min(1, 'At least one language is required'),
    originalLanguage: z.string().optional(),
    rating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR']).optional(),
    imdbRating: z.number().min(0).max(10).optional(),
    rottenTomatoesRating: z.number().min(0).max(100).optional(),
    posterUrl: z.string().min(1, 'Poster URL is required'),
    backdropUrl: z.string().optional(),
    trailerUrl: z.string().optional(),
    galleryImages: z.array(z.string()).optional(),
    budget: z.number().min(0).optional(),
    boxOffice: z.number().min(0).optional(),
    country: z.string().min(1, 'Country is required'),
    productionCompanies: z.array(z.string()).optional(),
    distributors: z.array(z.string()).optional(),
    castCrew: z.array(castCrewSchema).optional(),
    // Accept single string or array to align with admin UI
    formats: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.enum(['upcoming', 'released', 'in_production']).optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    awards: z.array(z.string()).optional(),
    // Admin-panel additional fields
    director: z.string().optional(),
    producer: z.string().optional(),
    productionCost: z.number().min(0).optional(),
    uaCertification: z.string().optional(),
    company: companySchema.optional(),
    cast: z.array(simpleCastSchema).optional(),
    crew: z.array(simpleCrewSchema).optional(),
  })
});

// Update movie validation
const updateMovieValidation = z.object({
  body: z.object({
    title: z.string().min(1, 'Movie title is required').optional(),
    originalTitle: z.string().optional(),
    description: z.string().min(1, 'Movie description is required').optional(),
    releaseDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid release date format'
    }).optional(),
    duration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
    genres: z.array(z.string().min(1, 'Genre cannot be empty')).min(1, 'At least one genre is required').optional(),
    languages: z.array(z.string().min(1, 'Language cannot be empty')).min(1, 'At least one language is required').optional(),
    originalLanguage: z.string().min(1, 'Original language is required').optional(),
    rating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR']).optional(),
    imdbRating: z.number().min(0).max(10).optional(),
    rottenTomatoesRating: z.number().min(0).max(100).optional(),
    posterUrl: z.string().min(1, 'Poster URL is required').optional(),
    backdropUrl: z.string().optional(),
    trailerUrl: z.string().optional(),
    galleryImages: z.array(z.string()).optional(),
    budget: z.number().min(0).optional(),
    boxOffice: z.number().min(0).optional(),
    country: z.string().min(1, 'Country is required').optional(),
    productionCompanies: z.array(z.string()).optional(),
    distributors: z.array(z.string()).optional(),
    castCrew: z.array(castCrewSchema).optional(),
    formats: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.enum(['upcoming', 'released', 'in_production']).optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    awards: z.array(z.string()).optional(),
    // Admin-panel additional fields
    director: z.string().optional(),
    producer: z.string().optional(),
    productionCost: z.number().min(0).optional(),
    uaCertification: z.string().optional(),
    company: companySchema.optional(),
    cast: z.array(simpleCastSchema).optional(),
    crew: z.array(simpleCrewSchema).optional(),
  })
});

// Add review validation
const addReviewValidation = z.object({
  body: reviewSchema
});

// Get movies query validation
const getMoviesValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    genre: z.string().optional(),
    language: z.string().optional(),
    country: z.string().optional(),
    status: z.enum(['upcoming', 'released', 'in_production']).optional(),
    rating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR']).optional(),
    releaseYear: z.string().optional(),
    minRating: z.string().optional(),
    maxRating: z.string().optional(),
    format: z.string().optional(),
    sortBy: z.enum(['title', 'releaseDate', 'imdbRating', 'averageRating', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

export const MovieValidation = {
  createMovieValidation,
  updateMovieValidation,
  addReviewValidation,
  getMoviesValidation
};
