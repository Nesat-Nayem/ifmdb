"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScanHistorySchema = exports.getScannerByIdSchema = exports.validateTicketSchema = exports.scannerLoginSchema = exports.updateScannerAccessSchema = exports.createScannerAccessSchema = void 0;
const zod_1 = require("zod");
// Create scanner access validation
exports.createScannerAccessSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        phone: zod_1.z.string().optional(),
        allowedEvents: zod_1.z.array(zod_1.z.string()).optional(),
        notes: zod_1.z.string().optional(),
    }),
});
// Update scanner access validation
exports.updateScannerAccessSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        phone: zod_1.z.string().optional(),
        password: zod_1.z.string().min(6).optional(),
        allowedEvents: zod_1.z.array(zod_1.z.string()).optional(),
        notes: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
// Scanner login validation
exports.scannerLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
        deviceInfo: zod_1.z.string().optional(),
    }),
});
// Validate ticket validation
exports.validateTicketSchema = zod_1.z.object({
    body: zod_1.z.object({
        bookingReference: zod_1.z.string().min(1, 'Booking reference is required'),
        deviceInfo: zod_1.z.string().optional(),
        location: zod_1.z.object({
            latitude: zod_1.z.number().optional(),
            longitude: zod_1.z.number().optional(),
            address: zod_1.z.string().optional(),
        }).optional(),
    }),
});
// Get scanner access by ID validation
exports.getScannerByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
// Get scan history validation
exports.getScanHistorySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        eventId: zod_1.z.string().optional(),
        scanResult: zod_1.z.enum(['valid', 'invalid', 'already_used', 'expired', 'wrong_event', 'not_found']).optional(),
    }),
});
