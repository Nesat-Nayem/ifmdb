import { z } from 'zod';

// Location validation schema
const locationSchema = z.object({
  venueName: z.string().min(1, 'Venue name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

// Seat type validation schema
const seatTypeSchema = z.object({
  name: z.string().min(1, 'Seat type name is required'),
  price: z.number().min(0, 'Price cannot be negative'),
  totalSeats: z.number().min(0, 'Total seats cannot be negative'),
  availableSeats: z.number().min(0, 'Available seats cannot be negative')
});

// Performer validation schema
const performerSchema = z.object({
  name: z.string().min(1, 'Performer name is required'),
  type: z.enum(['artist', 'comedian', 'band', 'speaker', 'other']).optional(),
  image: z.string().optional(),
  bio: z.string().optional()
});

// Organizer validation schema
const organizerSchema = z.object({
  name: z.string().min(1, 'Organizer name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  logo: z.string().optional()
});

// Create event validation
const createEventValidation = z.object({
  body: z.object({
    title: z.string().min(1, 'Event title is required'),
    description: z.string().min(1, 'Event description is required'),
    eventType: z.enum(['comedy', 'music', 'concert', 'theater', 'sports', 'conference', 'workshop', 'other']),
    category: z.string().min(1, 'Event category is required'),
    categoryId: z.string().optional(),
    language: z.string().optional().default('English'),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid start date format'
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid end date format'
    }).optional(),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    location: locationSchema,
    ticketPrice: z.number().min(0, 'Ticket price cannot be negative'),
    totalSeats: z.number().min(1, 'Total seats must be at least 1'),
    availableSeats: z.number().min(0, 'Available seats cannot be negative'),
    seatTypes: z.array(seatTypeSchema).optional(),
    maxTicketsPerPerson: z.number().min(1).optional().default(10),
    posterImage: z.string().min(1, 'Poster image is required'),
    galleryImages: z.array(z.string()).optional(),
    performers: z.array(performerSchema).optional(),
    organizers: z.array(organizerSchema).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
    isActive: z.boolean().optional()
  })
});

// Update event validation
const updateEventValidation = z.object({
  body: z.object({
    title: z.string().min(1, 'Event title is required').optional(),
    description: z.string().min(1, 'Event description is required').optional(),
    eventType: z.enum(['comedy', 'music', 'concert', 'theater', 'sports', 'conference', 'workshop', 'other']).optional(),
    category: z.string().min(1, 'Event category is required').optional(),
    categoryId: z.string().optional(),
    language: z.string().optional(),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid start date format'
    }).optional(),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid end date format'
    }).optional(),
    startTime: z.string().min(1, 'Start time is required').optional(),
    endTime: z.string().min(1, 'End time is required').optional(),
    location: locationSchema.optional(),
    ticketPrice: z.number().min(0, 'Ticket price cannot be negative').optional(),
    totalSeats: z.number().min(1, 'Total seats must be at least 1').optional(),
    availableSeats: z.number().min(0, 'Available seats cannot be negative').optional(),
    seatTypes: z.array(seatTypeSchema).optional(),
    maxTicketsPerPerson: z.number().min(1).optional(),
    posterImage: z.string().min(1, 'Poster image is required').optional(),
    galleryImages: z.array(z.string()).optional(),
    performers: z.array(performerSchema).optional(),
    organizers: z.array(organizerSchema).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
    isActive: z.boolean().optional()
  })
});

// Get events query validation
const getEventsValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    eventType: z.string().optional(),
    category: z.string().optional(),
    categoryId: z.string().optional(),
    language: z.string().optional(),
    city: z.string().optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    sortBy: z.enum(['title', 'startDate', 'ticketPrice', 'createdAt', 'totalTicketsSold']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

export const EventValidation = {
  createEventValidation,
  updateEventValidation,
  getEventsValidation
};
