"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Cast and Crew Schema
const CastCrewSchema = new mongoose_1.Schema({
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
const CastSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    type: { type: String, default: '' },
    image: { type: String, default: '' },
});
const CrewSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    designation: { type: String, default: '' },
    image: { type: String, default: '' },
});
const CompanySchema = new mongoose_1.Schema({
    productionHouse: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
    state: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
}, { _id: false });
// Review Schema
const ReviewSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const movieSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true
});
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
movieSchema.pre('save', function (next) {
    if (this.reviews && this.reviews.length > 0) {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.averageRating = totalRating / this.reviews.length;
        this.totalReviews = this.reviews.length;
    }
    next();
});
const Movie = mongoose_1.default.model('Movie', movieSchema);
exports.default = Movie;
