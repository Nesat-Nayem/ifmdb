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
exports.EventBookingController = void 0;
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
// Create event ticket booking with seat type selection
const createEventBooking = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: eventId } = req.params;
    const { userId, quantity, seatType = 'Normal', bookingFee = 0, taxAmount = 0, discountAmount = 0, paymentMethod = 'card', customerDetails } = req.body;
    const event = yield events_model_1.default.findById(eventId);
    if (!event || !event.isActive || !['upcoming', 'ongoing'].includes(event.status)) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event not available for booking',
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
    // If event has seat types, find the matching seat type
    if (event.seatTypes && event.seatTypes.length > 0) {
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
        seatType,
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
        .populate('eventId', 'title posterImage startDate startTime location ticketPrice')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
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
        .populate('eventId', 'title posterImage startDate startTime location ticketPrice');
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
    // Generate e-ticket
    const ticketNumber = generateTicketNumber();
    const qrData = JSON.stringify({
        bookingId: id,
        ticketNumber,
        eventId: booking.eventId,
        quantity: booking.quantity,
        generatedAt: new Date(),
    });
    const qrCodeImageUrl = yield qrcode_1.default.toDataURL(qrData);
    const eTicket = yield event_booking_model_1.EventETicket.create({
        bookingId: id,
        ticketNumber,
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
    yield events_model_1.default.findByIdAndUpdate(booking.eventId, { $inc: { availableSeats: booking.quantity } });
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
exports.EventBookingController = {
    createEventBooking,
    getAllEventBookings,
    getEventBookingById,
    processEventPayment,
    cancelEventBooking,
    getEventETicket,
};
