import { z } from 'zod';

// Customer details schema
const customerDetailsSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
});

// Create event booking validation
const createEventBookingValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Event ID is required'),
  }),
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    bookingFee: z.number().min(0).optional(),
    taxAmount: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    paymentMethod: z.enum(['card', 'wallet', 'upi', 'netbanking', 'cash']).optional(),
    customerDetails: customerDetailsSchema,
  }),
});

// Get event bookings query validation
const getEventBookingsValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    userId: z.string().optional(),
    eventId: z.string().optional(),
    paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
    bookingStatus: z.enum(['confirmed', 'cancelled', 'expired']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['bookedAt', 'finalAmount', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

// Process payment validation
const processEventPaymentValidation = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
  body: z.object({
    paymentGateway: z.enum(['stripe', 'razorpay', 'paypal', 'paytm']),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    amount: z.number().min(0, 'Amount cannot be negative'),
    currency: z.string().optional(),
    gatewayTransactionId: z.string().min(1, 'Gateway transaction ID is required'),
    gatewayResponse: z.any().optional(),
  }),
});

export const EventBookingValidation = {
  createEventBookingValidation,
  getEventBookingsValidation,
  processEventPaymentValidation,
};
