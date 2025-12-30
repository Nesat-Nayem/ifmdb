import { z } from 'zod';

// Create scanner access validation
export const createScannerAccessSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
    allowedEvents: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

// Update scanner access validation
export const updateScannerAccessSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    password: z.string().min(6).optional(),
    allowedEvents: z.array(z.string()).optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Scanner login validation
export const scannerLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    deviceInfo: z.string().optional(),
  }),
});

// Validate ticket validation
export const validateTicketSchema = z.object({
  body: z.object({
    bookingReference: z.string().min(1, 'Booking reference is required'),
    deviceInfo: z.string().optional(),
    location: z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      address: z.string().optional(),
    }).optional(),
  }),
});

// Get scanner access by ID validation
export const getScannerByIdSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

// Get scan history validation
export const getScanHistorySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    eventId: z.string().optional(),
    scanResult: z.enum(['valid', 'invalid', 'already_used', 'expired', 'wrong_event', 'not_found']).optional(),
  }),
});
