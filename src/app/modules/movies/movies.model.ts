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
  originalLanguage: string;
  rating: string; // PG, PG-13, R, etc.
  imdbRating: number;
  rottenTomatoesRating: number;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
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
  formats: string[]; // 2D, 3D, IMAX, 4DX
  status: 'upcoming' | 'released' | 'in_production';
  isActive: boolean;
  tags: string[];
  awards: string[];
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
      required: [true, 'Original language is required']
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
      enum: ['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema', 'ScreenX']
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
    }]
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
