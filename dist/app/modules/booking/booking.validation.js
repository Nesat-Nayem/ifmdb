"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingValidation = void 0;
const zod_1 = require("zod");
// Cinema validation schema
const createCinemaValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Cinema name is required'),
        address: zod_1.z.string().min(1, 'Address is required'),
        city: zod_1.z.string().min(1, 'City is required'),
        state: zod_1.z.string().optional(),
        postalCode: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        facilities: zod_1.z.array(zod_1.z.string()).optional(),
        isActive: zod_1.z.boolean().optional()
    })
});
// Cinema Hall validation schema
const createCinemaHallValidation = zod_1.z.object({
    body: zod_1.z.object({
        cinemaId: zod_1.z.string().min(1, 'Cinema ID is required'),
        hallName: zod_1.z.string().min(1, 'Hall name is required'),
        totalSeats: zod_1.z.number().min(1, 'Total seats must be at least 1'),
        hallType: zod_1.z.enum(['standard', 'premium', 'imax', '4dx', 'dolby']).optional(),
        screenType: zod_1.z.enum(['2D', '3D', 'IMAX']).optional(),
        seatLayout: zod_1.z.object({
            rows: zod_1.z.number().min(1, 'Rows must be at least 1'),
            seatsPerRow: zod_1.z.number().min(1, 'Seats per row must be at least 1')
        }),
        isActive: zod_1.z.boolean().optional()
    })
});
// Seat validation schema
const createSeatValidation = zod_1.z.object({
    body: zod_1.z.object({
        hallId: zod_1.z.string().min(1, 'Hall ID is required'),
        rowLabel: zod_1.z.string().min(1, 'Row label is required'),
        seatNumber: zod_1.z.number().min(1, 'Seat number must be at least 1'),
        seatType: zod_1.z.enum(['standard', 'premium', 'vip', 'wheelchair']).optional(),
        isAvailable: zod_1.z.boolean().optional(),
        priceMultiplier: zod_1.z.number().min(0).optional()
    })
});
// Showtime validation schema
const createShowtimeValidation = zod_1.z.object({
    body: zod_1.z.object({
        movieId: zod_1.z.string().min(1, 'Movie ID is required'),
        hallId: zod_1.z.string().min(1, 'Hall ID is required'),
        showDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid show date format'
        }),
        showTime: zod_1.z.string().min(1, 'Show time is required'),
        endTime: zod_1.z.string().min(1, 'End time is required'),
        basePrice: zod_1.z.number().min(0, 'Base price cannot be negative'),
        formatType: zod_1.z.enum(['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema']).optional(),
        language: zod_1.z.string().min(1, 'Language is required'),
        availableSeats: zod_1.z.number().min(0, 'Available seats cannot be negative'),
        status: zod_1.z.enum(['active', 'cancelled', 'housefull']).optional(),
        isActive: zod_1.z.boolean().optional()
    })
});
// Selected seat schema for booking
const selectedSeatSchema = zod_1.z.object({
    seatId: zod_1.z.string().min(1, 'Seat ID is required'),
    rowLabel: zod_1.z.string().min(1, 'Row label is required'),
    seatNumber: zod_1.z.number().min(1, 'Seat number is required'),
    seatType: zod_1.z.string().min(1, 'Seat type is required'),
    seatPrice: zod_1.z.number().min(0, 'Seat price cannot be negative')
});
// Customer details schema
const customerDetailsSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Customer name is required'),
    email: zod_1.z.string().email('Valid email is required'),
    phone: zod_1.z.string().min(1, 'Phone number is required')
});
// Booking validation schema
const createBookingValidation = zod_1.z.object({
    body: zod_1.z.object({
        showtimeId: zod_1.z.string().min(1, 'Showtime ID is required'),
        userId: zod_1.z.string().min(1, 'User ID is required'),
        selectedSeats: zod_1.z.array(selectedSeatSchema).min(1, 'At least one seat must be selected'),
        totalAmount: zod_1.z.number().min(0, 'Total amount cannot be negative'),
        bookingFee: zod_1.z.number().min(0).optional(),
        taxAmount: zod_1.z.number().min(0).optional(),
        discountAmount: zod_1.z.number().min(0).optional(),
        finalAmount: zod_1.z.number().min(0, 'Final amount cannot be negative'),
        paymentMethod: zod_1.z.enum(['card', 'wallet', 'upi', 'netbanking', 'cash']).optional(),
        customerDetails: customerDetailsSchema
    })
});
// Payment validation schema
const processPaymentValidation = zod_1.z.object({
    body: zod_1.z.object({
        paymentGateway: zod_1.z.enum(['stripe', 'razorpay', 'paypal', 'paytm']),
        paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
        amount: zod_1.z.number().min(0, 'Amount cannot be negative'),
        currency: zod_1.z.string().optional(),
        gatewayTransactionId: zod_1.z.string().min(1, 'Gateway transaction ID is required'),
        gatewayResponse: zod_1.z.any().optional()
    })
});
// Get bookings query validation
const getBookingsValidation = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        userId: zod_1.z.string().optional(),
        showtimeId: zod_1.z.string().optional(),
        paymentStatus: zod_1.z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
        bookingStatus: zod_1.z.enum(['confirmed', 'cancelled', 'expired']).optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['bookedAt', 'finalAmount', 'createdAt']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
    })
});
// Get showtimes query validation
const getShowtimesValidation = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        movieId: zod_1.z.string().optional(),
        cinemaId: zod_1.z.string().optional(),
        hallId: zod_1.z.string().optional(),
        showDate: zod_1.z.string().optional(),
        language: zod_1.z.string().optional(),
        formatType: zod_1.z.enum(['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema']).optional(),
        city: zod_1.z.string().optional(),
        status: zod_1.z.enum(['active', 'cancelled', 'housefull']).optional(),
        sortBy: zod_1.z.enum(['showTime', 'basePrice', 'createdAt']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
    })
});
// Get cinemas query validation
const getCinemasValidation = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['name', 'city', 'createdAt']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
    })
});
// Update validation schemas
const updateCinemaValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Cinema name is required').optional(),
        address: zod_1.z.string().min(1, 'Address is required').optional(),
        city: zod_1.z.string().min(1, 'City is required').optional(),
        state: zod_1.z.string().optional(),
        postalCode: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        facilities: zod_1.z.array(zod_1.z.string()).optional(),
        isActive: zod_1.z.boolean().optional()
    })
});
const updateShowtimeValidation = zod_1.z.object({
    body: zod_1.z.object({
        movieId: zod_1.z.string().min(1, 'Movie ID is required').optional(),
        hallId: zod_1.z.string().min(1, 'Hall ID is required').optional(),
        showDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid show date format'
        }).optional(),
        showTime: zod_1.z.string().min(1, 'Show time is required').optional(),
        endTime: zod_1.z.string().min(1, 'End time is required').optional(),
        basePrice: zod_1.z.number().min(0, 'Base price cannot be negative').optional(),
        formatType: zod_1.z.enum(['2D', '3D', 'IMAX', '4DX', 'Dolby Cinema']).optional(),
        language: zod_1.z.string().min(1, 'Language is required').optional(),
        availableSeats: zod_1.z.number().min(0, 'Available seats cannot be negative').optional(),
        status: zod_1.z.enum(['active', 'cancelled', 'housefull']).optional(),
        isActive: zod_1.z.boolean().optional()
    })
});
const updateBookingValidation = zod_1.z.object({
    body: zod_1.z.object({
        paymentStatus: zod_1.z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
        bookingStatus: zod_1.z.enum(['confirmed', 'cancelled', 'expired']).optional(),
        transactionId: zod_1.z.string().optional(),
        customerDetails: customerDetailsSchema.optional()
    })
});
exports.BookingValidation = {
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
