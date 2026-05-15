"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAttendanceDate = exports.EventBookingController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importDefault(require("mongoose"));
const qrcode_1 = __importDefault(require("qrcode"));
const events_model_1 = __importDefault(require("./events.model"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const event_booking_model_1 = require("./event-booking.model");
// Generate unique booking reference
const generateBookingReference = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `EBK${timestamp}${randomStr}`.toUpperCase();
};
// Generate unique ticket number
const generateTicketNumber = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `ETK${timestamp}${randomStr}`.toUpperCase();
};
// Generate unique ticket scanner ID (for QR code scanning)
const generateTicketScannerId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    const checksum = Math.random().toString(36).substring(2, 4);
    return `SCAN${timestamp}${randomStr}${checksum}`.toUpperCase();
};
// Validate attendance date falls within the event's running window (start → end)
// Returns a normalized Date (set to midnight UTC of the chosen day) or null.
const resolveAttendanceDate = (attendanceDate, event) => {
    // Helper to strip time portion
    const toDayStart = (d) => {
        const copy = new Date(d);
        copy.setHours(0, 0, 0, 0);
        return copy;
    };
    const eventStart = toDayStart(new Date(event.startDate));
    const eventEnd = event.endDate ? toDayStart(new Date(event.endDate)) : eventStart;
    // If no attendance date provided, default to event start date
    if (!attendanceDate) {
        return { valid: true, value: eventStart };
    }
    const parsed = new Date(attendanceDate);
    if (isNaN(parsed.getTime())) {
        return { valid: false, value: null, message: 'Invalid attendance date' };
    }
    const attendDay = toDayStart(parsed);
    if (attendDay.getTime() < eventStart.getTime() || attendDay.getTime() > eventEnd.getTime()) {
        return {
            valid: false,
            value: null,
            message: 'Attendance date must be within the event duration',
        };
    }
    return { valid: true, value: attendDay };
};
exports.resolveAttendanceDate = resolveAttendanceDate;
// Create event ticket booking with seat type selection
const createEventBooking = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: eventId } = req.params;
    const { userId, quantity, bookingType = 'ticket', seatType = 'Normal', eventPass, eventCategory = 'Ticket Booking', attendanceDate, bookingFee = 0, taxAmount = 0, discountAmount = 0, paymentMethod = 'card', customerDetails } = req.body;
    const event = yield events_model_1.default.findById(eventId);
    if (!event || !event.isActive || !['upcoming', 'ongoing'].includes(event.status)) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event not available for booking',
            data: null,
        });
    }
    // Validate attendance date for multi-day events (only for regular tickets)
    const attendance = resolveAttendanceDate(attendanceDate, {
        startDate: event.startDate,
        endDate: event.endDate,
    });
    if (!attendance.valid) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: attendance.message || 'Invalid attendance date',
            data: null,
        });
    }
    // Check max tickets per person
    if (quantity > event.maxTicketsPerPerson) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: `Maximum ${event.maxTicketsPerPerson} tickets allowed per person`,
            data: null,
        });
    }
    let unitPrice = event.ticketPrice;
    let updateQuery = { $inc: { availableSeats: -quantity, totalTicketsSold: quantity } };
    let resolvedPass = null;
    // === EVENT PASS BOOKING ===
    if (bookingType === 'pass') {
        if (!eventPass) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Event pass is required for pass booking',
                data: null,
            });
        }
        if (!event.eventPasses || event.eventPasses.length === 0) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'This event does not offer passes',
                data: null,
            });
        }
        const selectedPass = event.eventPasses.find((p) => p.name.toLowerCase() === eventPass.toLowerCase());
        if (!selectedPass) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: `Event pass "${eventPass}" not found for this event`,
                data: null,
            });
        }
        if (quantity > (selectedPass.maxPassesPerPerson || 5)) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: `Maximum ${selectedPass.maxPassesPerPerson || 5} ${eventPass} passes per person`,
                data: null,
            });
        }
        if (selectedPass.availablePasses < quantity) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: `Not enough ${eventPass} passes available`,
                data: null,
            });
        }
        unitPrice = selectedPass.price;
        resolvedPass = selectedPass;
        // Atomically decrement pass availability
        const updatedEvent = yield events_model_1.default.findOneAndUpdate({
            _id: eventId,
            'eventPasses.name': selectedPass.name,
            'eventPasses.availablePasses': { $gte: quantity },
        }, {
            $inc: {
                'eventPasses.$.availablePasses': -quantity,
                totalTicketsSold: quantity,
            },
        }, { new: true });
        if (!updatedEvent) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Not enough passes available',
                data: null,
            });
        }
    }
    // === REGULAR TICKET BOOKING (seat type) ===
    else if (event.seatTypes && event.seatTypes.length > 0) {
        const selectedSeatType = event.seatTypes.find(st => st.name.toLowerCase() === seatType.toLowerCase());
        if (!selectedSeatType) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: `Seat type "${seatType}" not found for this event`,
                data: null,
            });
        }
        if (selectedSeatType.availableSeats < quantity) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: `Not enough ${seatType} seats available`,
                data: null,
            });
        }
        unitPrice = selectedSeatType.price;
        // Update the specific seat type's available seats
        const updatedEvent = yield events_model_1.default.findOneAndUpdate({
            _id: eventId,
            'seatTypes.name': seatType,
            'seatTypes.availableSeats': { $gte: quantity }
        }, {
            $inc: {
                'seatTypes.$.availableSeats': -quantity,
                availableSeats: -quantity,
                totalTicketsSold: quantity
            }
        }, { new: true });
        if (!updatedEvent) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Not enough available tickets',
                data: null,
            });
        }
    }
    else {
        // Attempt atomic decrement of available seats (for events without seat types)
        const updatedEvent = yield events_model_1.default.findOneAndUpdate({ _id: eventId, availableSeats: { $gte: quantity } }, updateQuery, { new: true });
        if (!updatedEvent) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Not enough available tickets',
                data: null,
            });
        }
    }
    const totalAmount = unitPrice * quantity;
    const finalAmount = totalAmount + bookingFee + taxAmount - discountAmount;
    const bookingData = {
        eventId: new mongoose_1.default.Types.ObjectId(eventId),
        userId: new mongoose_1.default.Types.ObjectId(userId),
        bookingReference: generateBookingReference(),
        quantity,
        bookingType,
        seatType: bookingType === 'pass' ? (eventPass || 'Pass') : seatType,
        eventPass: bookingType === 'pass' ? eventPass : '',
        passPerks: bookingType === 'pass' && resolvedPass
            ? {
                foodIncluded: !!resolvedPass.foodIncluded,
                parkingAvailable: !!resolvedPass.parkingAvailable,
                description: resolvedPass.description || '',
            }
            : undefined,
        eventCategory,
        // Passes cover all days, so attendance date is not meaningful; keep null.
        attendanceDate: bookingType === 'pass' ? null : attendance.value,
        unitPrice,
        totalAmount,
        bookingFee,
        taxAmount,
        discountAmount,
        finalAmount,
        paymentStatus: 'pending',
        bookingStatus: 'confirmed',
        paymentMethod,
        transactionId: '',
        bookedAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        customerDetails,
    };
    const newBooking = yield event_booking_model_1.EventBooking.create(bookingData);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Event booking created successfully',
        data: newBooking,
    });
}));
const getAllEventBookings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { page = 1, limit = 10, userId, eventId, paymentStatus, bookingStatus, startDate, endDate, sortBy = 'bookedAt', sortOrder = 'desc', } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (userId)
        filter.userId = userId;
    if (eventId)
        filter.eventId = eventId;
    if (paymentStatus)
        filter.paymentStatus = paymentStatus;
    if (bookingStatus)
        filter.bookingStatus = bookingStatus;
    // Role-based filtering: Vendors only see bookings for their own events
    if (user && user.role === 'vendor') {
        const vendorEvents = yield events_model_1.default.find({ vendorId: user._id }).select('_id');
        const eventIds = vendorEvents.map(e => e._id);
        filter.eventId = { $in: eventIds };
    }
    if (startDate || endDate) {
        filter.bookedAt = {};
        if (startDate)
            filter.bookedAt.$gte = new Date(startDate);
        if (endDate)
            filter.bookedAt.$lte = new Date(endDate);
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const bookings = yield event_booking_model_1.EventBooking.find(filter)
        .populate('userId', 'name email phone')
        .populate('eventId', 'title posterImage startDate endDate startTime location ticketPrice eventPasses')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
    // Attach matching e-ticket (for pass usage history & QR display) to each booking.
    const bookingIds = bookings.map((b) => b._id);
    if (bookingIds.length > 0) {
        const eTickets = yield event_booking_model_1.EventETicket.find({ bookingId: { $in: bookingIds } })
            .select('bookingId ticketNumber ticketScannerId qrCodeImageUrl isUsed usedAt passUsageHistory generatedAt')
            .lean();
        const byBooking = new Map();
        eTickets.forEach((t) => byBooking.set(String(t.bookingId), t));
        bookings.forEach((b) => {
            b.eTicket = byBooking.get(String(b._id)) || null;
        });
    }
    const total = yield event_booking_model_1.EventBooking.countDocuments(filter);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event bookings retrieved successfully',
        data: bookings,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
}));
const getEventBookingById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const booking = yield event_booking_model_1.EventBooking.findById(id)
        .populate('userId', 'name email phone')
        .populate('eventId', 'title posterImage startDate endDate startTime location ticketPrice eventPasses');
    if (!booking) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event booking not found',
            data: null,
        });
    }
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event booking retrieved successfully',
        data: booking,
    });
}));
const processEventPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // booking id
    const paymentData = req.body;
    const booking = yield event_booking_model_1.EventBooking.findById(id);
    if (!booking) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event booking not found',
            data: null,
        });
    }
    if (booking.paymentStatus === 'completed') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Payment already completed',
            data: null,
        });
    }
    // Record transaction
    const transaction = yield event_booking_model_1.EventPaymentTransaction.create(Object.assign(Object.assign({ bookingId: id }, paymentData), { processedAt: new Date() }));
    // Update booking
    const updatedBooking = yield event_booking_model_1.EventBooking.findByIdAndUpdate(id, { paymentStatus: 'completed', transactionId: paymentData.gatewayTransactionId }, { new: true });
    // Generate e-ticket with scanner ID
    const ticketNumber = generateTicketNumber();
    const ticketScannerId = generateTicketScannerId();
    const qrData = JSON.stringify({
        ticketScannerId,
        bookingId: id,
        ticketNumber,
        eventId: booking.eventId,
        quantity: booking.quantity,
        seatType: booking.seatType,
        generatedAt: new Date(),
    });
    const qrCodeImageUrl = yield qrcode_1.default.toDataURL(qrData);
    const eTicket = yield event_booking_model_1.EventETicket.create({
        bookingId: id,
        ticketNumber,
        ticketScannerId,
        qrCodeData: qrData,
        qrCodeImageUrl,
        quantity: booking.quantity,
    });
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event payment processed successfully',
        data: {
            booking: updatedBooking,
            transaction,
            eTicket,
        },
    });
}));
const cancelEventBooking = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const booking = yield event_booking_model_1.EventBooking.findById(id);
    if (!booking) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event booking not found',
            data: null,
        });
    }
    if (booking.bookingStatus === 'cancelled') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Booking already cancelled',
            data: null,
        });
    }
    // Update booking status
    const updatedBooking = yield event_booking_model_1.EventBooking.findByIdAndUpdate(id, { bookingStatus: 'cancelled' }, { new: true });
    // Release tickets back to event availability
    if (booking.bookingType === 'pass' && booking.eventPass) {
        yield events_model_1.default.findOneAndUpdate({ _id: booking.eventId, 'eventPasses.name': booking.eventPass }, {
            $inc: {
                'eventPasses.$.availablePasses': booking.quantity,
                totalTicketsSold: -booking.quantity,
            },
        });
    }
    else {
        yield events_model_1.default.findByIdAndUpdate(booking.eventId, { $inc: { availableSeats: booking.quantity } });
    }
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event booking cancelled successfully',
        data: updatedBooking,
    });
}));
const getEventETicket = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // booking id
    const eTicket = yield event_booking_model_1.EventETicket.findOne({ bookingId: id })
        .populate({
        path: 'bookingId',
        populate: [
            { path: 'userId', select: 'name email phone' },
            { path: 'eventId', select: 'title posterImage startDate startTime location' },
        ],
    });
    if (!eTicket) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'E-ticket not found',
            data: null,
        });
    }
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'E-ticket retrieved successfully',
        data: eTicket,
    });
}));
// Validate/Scan ticket by scanner ID
const validateTicketByScannerId = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { scannerId } = req.params;
    const { scannedBy, scanLocation } = req.body;
    const eTicket = yield event_booking_model_1.EventETicket.findOne({ ticketScannerId: scannerId })
        .populate({
        path: 'bookingId',
        populate: [
            { path: 'userId', select: 'name email phone' },
            { path: 'eventId', select: 'title posterImage startDate startTime endTime location status' },
        ],
    });
    if (!eTicket) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Invalid ticket - Ticket not found',
            data: null,
        });
    }
    // Check if ticket is already used
    if (eTicket.isUsed) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Ticket already used',
            data: {
                ticketScannerId: eTicket.ticketScannerId,
                ticketNumber: eTicket.ticketNumber,
                usedAt: eTicket.usedAt,
                isUsed: true,
            },
        });
    }
    // Get booking details
    const booking = eTicket.bookingId;
    // Check if booking is valid
    if (booking.bookingStatus === 'cancelled') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Ticket booking has been cancelled',
            data: null,
        });
    }
    if (booking.paymentStatus !== 'completed') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Payment not completed for this ticket',
            data: null,
        });
    }
    // Check if event is valid
    const event = booking.eventId;
    if (!event || !['upcoming', 'ongoing'].includes(event.status)) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Event is not active or has ended',
            data: null,
        });
    }
    // Mark ticket as used
    const updatedTicket = yield event_booking_model_1.EventETicket.findByIdAndUpdate(eTicket._id, {
        isUsed: true,
        usedAt: new Date(),
        scannedBy: scannedBy || null,
        scanLocation: scanLocation || '',
    }, { new: true }).populate({
        path: 'bookingId',
        populate: [
            { path: 'userId', select: 'name email phone' },
            { path: 'eventId', select: 'title posterImage startDate startTime endTime location' },
        ],
    });
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Ticket validated successfully - Entry allowed',
        data: {
            ticketScannerId: updatedTicket === null || updatedTicket === void 0 ? void 0 : updatedTicket.ticketScannerId,
            ticketNumber: updatedTicket === null || updatedTicket === void 0 ? void 0 : updatedTicket.ticketNumber,
            quantity: updatedTicket === null || updatedTicket === void 0 ? void 0 : updatedTicket.quantity,
            isUsed: true,
            usedAt: updatedTicket === null || updatedTicket === void 0 ? void 0 : updatedTicket.usedAt,
            booking: updatedTicket === null || updatedTicket === void 0 ? void 0 : updatedTicket.bookingId,
        },
    });
}));
// Check ticket status without marking as used
const checkTicketStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { scannerId } = req.params;
    const eTicket = yield event_booking_model_1.EventETicket.findOne({ ticketScannerId: scannerId })
        .populate({
        path: 'bookingId',
        populate: [
            { path: 'userId', select: 'name email phone' },
            { path: 'eventId', select: 'title posterImage startDate startTime endTime location status' },
        ],
    });
    if (!eTicket) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Ticket not found',
            data: null,
        });
    }
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Ticket status retrieved successfully',
        data: {
            ticketScannerId: eTicket.ticketScannerId,
            ticketNumber: eTicket.ticketNumber,
            quantity: eTicket.quantity,
            isUsed: eTicket.isUsed,
            usedAt: eTicket.usedAt,
            generatedAt: eTicket.generatedAt,
            booking: eTicket.bookingId,
        },
    });
}));
// Delete event booking
const deleteEventBooking = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const booking = yield event_booking_model_1.EventBooking.findById(id);
    if (!booking) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event booking not found',
            data: null,
        });
    }
    // Delete associated e-tickets
    yield event_booking_model_1.EventETicket.deleteMany({ bookingId: id });
    // Delete associated transactions
    yield event_booking_model_1.EventPaymentTransaction.deleteMany({ bookingId: id });
    // Release seats back if booking was confirmed
    if (booking.bookingStatus === 'confirmed') {
        if (booking.bookingType === 'pass' && booking.eventPass) {
            yield events_model_1.default.findOneAndUpdate({ _id: booking.eventId, 'eventPasses.name': booking.eventPass }, {
                $inc: {
                    'eventPasses.$.availablePasses': booking.quantity,
                    totalTicketsSold: -booking.quantity,
                },
            });
        }
        else {
            yield events_model_1.default.findByIdAndUpdate(booking.eventId, {
                $inc: { availableSeats: booking.quantity, totalTicketsSold: -booking.quantity }
            });
        }
    }
    // Delete the booking
    yield event_booking_model_1.EventBooking.findByIdAndDelete(id);
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event booking deleted successfully',
        data: null,
    });
}));
exports.EventBookingController = {
    createEventBooking,
    getAllEventBookings,
    getEventBookingById,
    processEventPayment,
    cancelEventBooking,
    getEventETicket,
    validateTicketByScannerId,
    checkTicketStatus,
    deleteEventBooking,
};
