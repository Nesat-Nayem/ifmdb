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
// Seat Type Schema for dynamic pricing
const SeatTypeSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    totalSeats: {
        type: Number,
        required: true,
        min: 0
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 0
    }
});
// Event Performer Schema
const EventPerformerSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['artist', 'comedian', 'band', 'speaker', 'other'],
        default: 'artist'
    },
    image: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    }
});
// Event Organizer Schema
const EventOrganizerSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    logo: {
        type: String,
        default: ''
    }
});
// Location Schema
const LocationSchema = new mongoose_1.Schema({
    venueName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        default: ''
    },
    postalCode: {
        type: String,
        default: ''
    },
    latitude: {
        type: Number,
        default: 0
    },
    longitude: {
        type: Number,
        default: 0
    }
});
const eventSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Event description is required']
    },
    eventType: {
        type: String,
        enum: ['comedy', 'music', 'concert', 'theater', 'sports', 'conference', 'workshop', 'other'],
        required: [true, 'Event type is required']
    },
    category: {
        type: String,
        required: [true, 'Event category is required']
    },
    categoryId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'EventCategory'
    },
    language: {
        type: String,
        default: 'English'
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: String,
        required: [true, 'End time is required']
    },
    location: {
        type: LocationSchema,
        required: [true, 'Location is required']
    },
    ticketPrice: {
        type: Number,
        required: [true, 'Ticket price is required'],
        min: [0, 'Ticket price cannot be negative']
    },
    totalSeats: {
        type: Number,
        required: [true, 'Total seats is required'],
        min: [1, 'Total seats must be at least 1']
    },
    availableSeats: {
        type: Number,
        required: [true, 'Available seats is required'],
        min: [0, 'Available seats cannot be negative']
    },
    seatTypes: {
        type: [SeatTypeSchema],
        default: []
    },
    maxTicketsPerPerson: {
        type: Number,
        default: 10,
        min: [1, 'Max tickets per person must be at least 1']
    },
    totalTicketsSold: {
        type: Number,
        default: 0
    },
    posterImage: {
        type: String,
        required: [true, 'Poster image is required']
    },
    galleryImages: [{
            type: String
        }],
    performers: [EventPerformerSchema],
    organizers: [EventOrganizerSchema],
    tags: [{
            type: String,
            trim: true
        }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Indexes for better query performance
eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ eventType: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ categoryId: 1 });
eventSchema.index({ language: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ totalTicketsSold: -1 });
const Event = mongoose_1.default.model('Event', eventSchema);
exports.default = Event;
