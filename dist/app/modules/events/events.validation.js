"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventValidation = void 0;
const zod_1 = require("zod");
// Location validation schema
const locationSchema = zod_1.z.object({
    venueName: zod_1.z.string().min(1, 'Venue name is required'),
    address: zod_1.z.string().min(1, 'Address is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().optional(),
    postalCode: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional()
});
// Performer validation schema
const performerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Performer name is required'),
    type: zod_1.z.enum(['artist', 'comedian', 'band', 'speaker', 'other']).optional(),
    image: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional()
});
// Organizer validation schema
const organizerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Organizer name is required'),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    logo: zod_1.z.string().optional()
});
// Create event validation
const createEventValidation = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Event title is required'),
        description: zod_1.z.string().min(1, 'Event description is required'),
        eventType: zod_1.z.enum(['comedy', 'music', 'concert', 'theater', 'sports', 'conference', 'workshop', 'other']),
        category: zod_1.z.string().min(1, 'Event category is required'),
        startDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid start date format'
        }),
        endDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid end date format'
        }).optional(),
        startTime: zod_1.z.string().min(1, 'Start time is required'),
        endTime: zod_1.z.string().min(1, 'End time is required'),
        location: locationSchema,
        ticketPrice: zod_1.z.number().min(0, 'Ticket price cannot be negative'),
        totalSeats: zod_1.z.number().min(1, 'Total seats must be at least 1'),
        availableSeats: zod_1.z.number().min(0, 'Available seats cannot be negative'),
        posterImage: zod_1.z.string().min(1, 'Poster image is required'),
        galleryImages: zod_1.z.array(zod_1.z.string()).optional(),
        performers: zod_1.z.array(performerSchema).optional(),
        organizers: zod_1.z.array(organizerSchema).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        status: zod_1.z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
        isActive: zod_1.z.boolean().optional()
    })
});
// Update event validation
const updateEventValidation = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Event title is required').optional(),
        description: zod_1.z.string().min(1, 'Event description is required').optional(),
        eventType: zod_1.z.enum(['comedy', 'music', 'concert', 'theater', 'sports', 'conference', 'workshop', 'other']).optional(),
        category: zod_1.z.string().min(1, 'Event category is required').optional(),
        startDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid start date format'
        }).optional(),
        endDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid end date format'
        }).optional(),
        startTime: zod_1.z.string().min(1, 'Start time is required').optional(),
        endTime: zod_1.z.string().min(1, 'End time is required').optional(),
        location: locationSchema.optional(),
        ticketPrice: zod_1.z.number().min(0, 'Ticket price cannot be negative').optional(),
        totalSeats: zod_1.z.number().min(1, 'Total seats must be at least 1').optional(),
        availableSeats: zod_1.z.number().min(0, 'Available seats cannot be negative').optional(),
        posterImage: zod_1.z.string().min(1, 'Poster image is required').optional(),
        galleryImages: zod_1.z.array(zod_1.z.string()).optional(),
        performers: zod_1.z.array(performerSchema).optional(),
        organizers: zod_1.z.array(organizerSchema).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        status: zod_1.z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
        isActive: zod_1.z.boolean().optional()
    })
});
// Get events query validation
const getEventsValidation = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        eventType: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        status: zod_1.z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        minPrice: zod_1.z.string().optional(),
        maxPrice: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['title', 'startDate', 'ticketPrice', 'createdAt']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
    })
});
exports.EventValidation = {
    createEventValidation,
    updateEventValidation,
    getEventsValidation
};
