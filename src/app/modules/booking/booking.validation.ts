import { z } from 'zod';

// Cinema validation schema
const createCinemaValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Cinema name is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    facilities: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  })
});

// Cinema Hall validation schema
const createCinemaHallValidation = z.object({
  body: z.object({
    cinemaId: z.string().min(1, 'Cinema ID is required'),
    hallName: z.string().min(1, 'Hall name is required'),
    totalSeats: z.number().min(1, 'Total seats must be at least 1'),
    hallType: z.enum(['standard', 'premium', 'imax', '4dx', 'dolby']).optional(),
    screenType: z.enum(['2D', '3D', 'IMAX']).optional(),
    seatLayout: z.object({
      rows: z.number().min(1, 'Rows must be at least 1'),
      seatsPerRow: z.number().min(1, 'Seats per row must be at least 1')
    }),
    isActive: z.boolean().optional()
  })
});

// Seat validation schema
const createSeatValidation = z.object({
  body: z.object({
    hallId: z.string().min(1, 'Hall ID is required'),
    rowLabel: z.string().min(1, 'Row label is required'),
    seatNumber: z.number().min(1, 'Seat number must be at least 1'),
    seatType: z.enum(['standard', 'premium', 'vip', 'wheelchair']).optional(),
    isAvailable: z.boolean().optional(),
    priceMultiplier: z.number().min(0).optional()
  })
});

// Showtime validation schema
const createShowtimeValidation = z.object({
  body: z.object({
    movieId: z.string().min(1, 'Movie ID is required'),
    hallId: z.string().min(1, 'Hall ID is required'),
    showDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid show date format'
    }),
    showTime: z.string().min(1, 'Show time is required'),
    endTime: z.string().min(1, 'End time is required'),
    basePrice: z.number().min(0, 'Base price cannot be negative'),
    formatType: z.enum(['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema']).optional(),
    language: z.string().min(1, 'Language is required'),
    availableSeats: z.number().min(0, 'Available seats cannot be negative'),
    status: z.enum(['active', 'cancelled', 'housefull']).optional(),
    isActive: z.boolean().optional()
  })
});

// Selected seat schema for booking
const selectedSeatSchema = z.object({
  seatId: z.string().min(1, 'Seat ID is required'),
  rowLabel: z.string().min(1, 'Row label is required'),
  seatNumber: z.number().min(1, 'Seat number is required'),
  seatType: z.string().min(1, 'Seat type is required'),
  seatPrice: z.number().min(0, 'Seat price cannot be negative')
});

// Customer details schema
const customerDetailsSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required')
});

// Booking validation schema
const createBookingValidation = z.object({
  body: z.object({
    showtimeId: z.string().min(1, 'Showtime ID is required'),
    userId: z.string().min(1, 'User ID is required'),
    selectedSeats: z.array(selectedSeatSchema).min(1, 'At least one seat must be selected'),
    totalAmount: z.number().min(0, 'Total amount cannot be negative'),
    bookingFee: z.number().min(0).optional(),
    taxAmount: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    finalAmount: z.number().min(0, 'Final amount cannot be negative'),
    paymentMethod: z.enum(['card', 'wallet', 'upi', 'netbanking', 'cash']).optional(),
    customerDetails: customerDetailsSchema
  })
});

// Payment validation schema
const processPaymentValidation = z.object({
  body: z.object({
    paymentGateway: z.enum(['stripe', 'razorpay', 'paypal', 'paytm']),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    amount: z.number().min(0, 'Amount cannot be negative'),
    currency: z.string().optional(),
    gatewayTransactionId: z.string().min(1, 'Gateway transaction ID is required'),
    gatewayResponse: z.any().optional()
  })
});

// Get bookings query validation
const getBookingsValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    userId: z.string().optional(),
    showtimeId: z.string().optional(),
    paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
    bookingStatus: z.enum(['confirmed', 'cancelled', 'expired']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['bookedAt', 'finalAmount', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

// Get showtimes query validation
const getShowtimesValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    movieId: z.string().optional(),
    cinemaId: z.string().optional(),
    hallId: z.string().optional(),
    showDate: z.string().optional(),
    language: z.string().optional(),
    formatType: z.enum(['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema']).optional(),
    city: z.string().optional(),
    status: z.enum(['active', 'cancelled', 'housefull']).optional(),
    sortBy: z.enum(['showTime', 'basePrice', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

// Get cinemas query validation
const getCinemasValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    city: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'city', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

// Update validation schemas
const updateCinemaValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Cinema name is required').optional(),
    address: z.string().min(1, 'Address is required').optional(),
    city: z.string().min(1, 'City is required').optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    facilities: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  })
});

const updateShowtimeValidation = z.object({
  body: z.object({
    movieId: z.string().min(1, 'Movie ID is required').optional(),
    hallId: z.string().min(1, 'Hall ID is required').optional(),
    showDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid show date format'
    }).optional(),
    showTime: z.string().min(1, 'Show time is required').optional(),
    endTime: z.string().min(1, 'End time is required').optional(),
    basePrice: z.number().min(0, 'Base price cannot be negative').optional(),
    formatType: z.enum(['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema']).optional(),
    language: z.string().min(1, 'Language is required').optional(),
    availableSeats: z.number().min(0, 'Available seats cannot be negative').optional(),
    status: z.enum(['active', 'cancelled', 'housefull']).optional(),
    isActive: z.boolean().optional()
  })
});

const updateBookingValidation = z.object({
  body: z.object({
    paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
    bookingStatus: z.enum(['confirmed', 'cancelled', 'expired']).optional(),
    transactionId: z.string().optional(),
    customerDetails: customerDetailsSchema.optional()
  })
});

export const BookingValidation = {
  createCinemaValidation,
  updateCinemaValidation,
  createCinemaHallValidation,
  createSeatValidation,
  createShowtimeValidation,
  updateShowtimeValidation,
  createBookingValidation,
  updateBookingValidation,
  processPaymentValidation,
  getBookingsValidation,
  getShowtimesValidation,
  getCinemasValidation
};
