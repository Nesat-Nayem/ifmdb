import mongoose, { Document, Schema } from 'mongoose';

// Cast and Crew Schema
const CastCrewSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['actor', 'actress', 'director', 'producer', 'writer', 'cinematographer', 'music_director', 'editor', 'other'],
    required: true
  },
  characterName: {
    type: String, // For actors/actresses
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  isMainCast: {
    type: Boolean,
    default: false
  }
});

// Admin Panel specific simple schemas
const CastSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, default: '' },
  image: { type: String, default: '' },
});

const CrewSchema = new Schema({
  name: { type: String, required: true },
  designation: { type: String, default: '' },
  image: { type: String, default: '' },
});

const CompanySchema = new Schema({
  productionHouse: { type: String, default: '' },
  website: { type: String, default: '' },
  address: { type: String, default: '' },
  state: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
}, { _id: false });

// Country-wise Asking Price Schema
const CountryPricingSchema = new Schema({
  countryCode: { type: String, required: true },
  countryName: { type: String, required: true },
  currency: { type: String, required: true },
  askingPrice: { type: Number, min: 0, default: 0 },
  negotiable: { type: Boolean, default: true },
  notes: { type: String, default: '' },
}, { _id: false });

// Review Schema
const ReviewSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userImage: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  reviewText: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Movie Interface
export interface IMovie extends Document {
  title: string;
  originalTitle: string;
  description: string;
  releaseDate: Date;
  duration: number; // in minutes
  genres: string[];
  languages: string[];
  originalLanguage?: string;
  rating: string; // PG, PG-13, R, etc.
  imdbRating: number;
  rottenTomatoesRating: number;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  cloudflareTrailerUid?: string;
  galleryImages: string[];
  budget: number;
  boxOffice: number;
  country: string;
  productionCompanies: string[];
  distributors: string[];
  castCrew: typeof CastCrewSchema[];
  reviews: typeof ReviewSchema[];
  averageRating: number;
  totalReviews: number;
  formats: string[]; // e.g. 2D, 3D, IMAX, 4DX, Dolby Atmos, etc.
  status: 'upcoming' | 'released' | 'in_production';
  isActive: boolean;
  tags: string[];
  awards: string[];
  // Admin panel additional fields
  director?: string;
  producer?: string;
  productionCost?: number;
  uaCertification?: string;
  company?: {
    productionHouse?: string;
    website?: string;
    address?: string;
    state?: string;
    phone?: string;
    email?: string;
  };
  cast?: Array<{ name: string; type?: string; image?: string }>;
  crew?: Array<{ name: string; designation?: string; image?: string }>;
  countryPricing?: Array<{
    countryCode: string;
    countryName: string;
    currency: string;
    askingPrice: number;
    negotiable?: boolean;
    notes?: string;
  }>;
  tradeStatus?: string;
  // Visibility Schedule - for time-limited trade movies
  isScheduled: boolean;
  visibleFrom: Date | null;
  visibleUntil: Date | null;
  autoDeleteOnExpiry: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true
    },
    originalTitle: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Movie description is required']
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute']
    },
    genres: [{
      type: String,
      required: true
    }],
    languages: [{
      type: String,
      required: true
    }],
    originalLanguage: {
      type: String,
      default: ''
    },
    rating: {
      type: String,
      enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'],
      default: 'NR'
    },
    imdbRating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    rottenTomatoesRating: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    posterUrl: {
      type: String,
      required: [true, 'Poster URL is required']
    },
    backdropUrl: {
      type: String,
      default: ''
    },
    trailerUrl: {
      type: String,
      default: ''
    },
    cloudflareTrailerUid: {
      type: String,
      default: ''
    },
    galleryImages: [{
      type: String
    }],
    budget: {
      type: Number,
      min: 0,
      default: 0
    },
    boxOffice: {
      type: Number,
      min: 0,
      default: 0
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    productionCompanies: [{
      type: String
    }],
    distributors: [{
      type: String
    }],
    castCrew: [CastCrewSchema],
    reviews: [ReviewSchema],
    averageRating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    formats: [{
      type: String,
    }],
    status: {
      type: String,
      enum: ['upcoming', 'released', 'in_production'],
      default: 'upcoming'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    awards: [{
      type: String
    }],
    // Admin panel specific fields
    director: { type: String, default: '' },
    producer: { type: String, default: '' },
    productionCost: { type: Number, min: 0, default: 0 },
    uaCertification: { type: String, default: '' },
    company: { type: CompanySchema, default: undefined },
    cast: [CastSchema],
    crew: [CrewSchema],
    // Country-wise asking prices for film rights
    countryPricing: [CountryPricingSchema],
    // Vendor ownership
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Home page section for Trade Movies
    homeSection: {
      type: String,
      enum: ['', 'hot_rights_available', 'profitable_picks', 'international_deals', 'indie_gems'],
      default: '',
    },
    // Trade status for film mart cards (Get It Now, Sold Out, etc.)
    tradeStatus: {
      type: String,
      enum: ['get_it_now', 'sold_out', 'out_of_stock', 'coming_soon', 'limited_offer', 'negotiating'],
      default: 'get_it_now',
    },
    // Visibility Schedule - for time-limited trade movies
    isScheduled: {
      type: Boolean,
      default: false
    },
    visibleFrom: {
      type: Date,
      default: null
    },
    visibleUntil: {
      type: Date,
      default: null
    },
    autoDeleteOnExpiry: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
movieSchema.index({ title: 'text', description: 'text', tags: 'text' });
movieSchema.index({ genres: 1 });
movieSchema.index({ languages: 1 });
movieSchema.index({ releaseDate: 1 });
movieSchema.index({ status: 1 });
movieSchema.index({ isActive: 1 });
movieSchema.index({ averageRating: -1 });
movieSchema.index({ imdbRating: -1 });
movieSchema.index({ vendorId: 1 });
movieSchema.index({ homeSection: 1 });

// Pre-save middleware to calculate average rating
movieSchema.pre('save', function(this: any, next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  }
  next();
});

const Movie = mongoose.model<IMovie>('Movie', movieSchema);

export default Movie;
