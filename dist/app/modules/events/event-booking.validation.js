"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBookingValidation = void 0;
const zod_1 = require("zod");
// Customer details schema
const customerDetailsSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Customer name is required'),
    email: zod_1.z.string().email('Valid email is required'),
    phone: zod_1.z.string().min(1, 'Phone number is required'),
});
// Create event booking validation
const createEventBookingValidation = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Event ID is required'),
    }),
    body: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
        quantity: zod_1.z.number().min(1, 'Quantity must be at least 1'),
        seatType: zod_1.z.string().optional().default('Normal'),
        bookingFee: zod_1.z.number().min(0).optional(),
        taxAmount: zod_1.z.number().min(0).optional(),
        discountAmount: zod_1.z.number().min(0).optional(),
        paymentMethod: zod_1.z.enum(['card', 'wallet', 'upi', 'netbanking', 'cash']).optional(),
        customerDetails: customerDetailsSchema,
    }),
});
// Get event bookings query validation
const getEventBookingsValidation = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        userId: zod_1.z.string().optional(),
        eventId: zod_1.z.string().optional(),
        paymentStatus: zod_1.z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
        bookingStatus: zod_1.z.enum(['confirmed', 'cancelled', 'expired']).optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['bookedAt', 'finalAmount', 'createdAt']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
// Process payment validation
const processEventPaymentValidation = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Booking ID is required'),
    }),
    body: zod_1.z.object({
        paymentGateway: zod_1.z.enum(['stripe', 'razorpay', 'paypal', 'paytm']),
        paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
        amount: zod_1.z.number().min(0, 'Amount cannot be negative'),
        currency: zod_1.z.string().optional(),
        gatewayTransactionId: zod_1.z.string().min(1, 'Gateway transaction ID is required'),
        gatewayResponse: zod_1.z.any().optional(),
    }),
});
exports.EventBookingValidation = {
    createEventBookingValidation,
    getEventBookingsValidation,
    processEventPaymentValidation,
};
