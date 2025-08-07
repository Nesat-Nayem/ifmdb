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
exports.BookingController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importDefault(require("mongoose"));
const booking_model_1 = require("./booking.model");
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const qrcode_1 = __importDefault(require("qrcode"));
// Generate unique booking reference
const generateBookingReference = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `BK${timestamp}${randomStr}`.toUpperCase();
};
// Generate unique ticket number
const generateTicketNumber = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `TK${timestamp}${randomStr}`.toUpperCase();
};
// CINEMA CONTROLLERS
const createCinema = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cinemaData = req.body;
    const newCinema = yield booking_model_1.Cinema.create(cinemaData);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Cinema created successfully',
        data: newCinema
    });
}));
const getAllCinemas = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, city, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const filter = { isActive: true };
    if (city)
        filter.city = { $regex: city, $options: 'i' };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } }
        ];
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const cinemas = yield booking_model_1.Cinema.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield booking_model_1.Cinema.countDocuments(filter);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Cinemas retrieved successfully',
        data: cinemas,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
const getCinemaById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const cinema = yield booking_model_1.Cinema.findById(id);
    if (!cinema) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Cinema not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Cinema retrieved successfully',
        data: cinema
    });
}));
const updateCinema = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updateData = req.body;
    const updatedCinema = yield booking_model_1.Cinema.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedCinema) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Cinema not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Cinema updated successfully',
        data: updatedCinema
    });
}));
const deleteCinema = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deletedCinema = yield booking_model_1.Cinema.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!deletedCinema) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Cinema not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Cinema deleted successfully',
        data: deletedCinema
    });
}));
// SHOWTIME CONTROLLERS
const createShowtime = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const showtimeData = req.body;
    // Get hall details to set available seats
    const hall = yield booking_model_1.CinemaHall.findById(showtimeData.hallId);
    if (!hall) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Cinema hall not found',
            data: null
        });
    }
    if (!showtimeData.availableSeats) {
        showtimeData.availableSeats = hall.totalSeats;
    }
    const newShowtime = yield booking_model_1.Showtime.create(showtimeData);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Showtime created successfully',
        data: newShowtime
    });
}));
const getAllShowtimes = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, movieId, cinemaId, hallId, showDate, language, formatType, city, status, sortBy = 'showTime', sortOrder = 'asc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const filter = { isActive: true };
    if (movieId)
        filter.movieId = movieId;
    if (hallId)
        filter.hallId = hallId;
    if (language)
        filter.language = { $regex: language, $options: 'i' };
    if (formatType)
        filter.formatType = formatType;
    if (status)
        filter.status = status;
    if (showDate) {
        const date = new Date(showDate);
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        filter.showDate = { $gte: date, $lt: nextDate };
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    let showtimes = yield booking_model_1.Showtime.find(filter)
        .populate('movieId', 'title posterUrl duration')
        .populate({
        path: 'hallId',
        populate: {
            path: 'cinemaId',
            select: 'name address city'
        }
    })
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
    // Filter by city if provided
    if (city) {
        showtimes = showtimes.filter((showtime) => { var _a, _b, _c; return (_c = (_b = (_a = showtime.hallId) === null || _a === void 0 ? void 0 : _a.cinemaId) === null || _b === void 0 ? void 0 : _b.city) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(city.toLowerCase()); });
    }
    const total = yield booking_model_1.Showtime.countDocuments(filter);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Showtimes retrieved successfully',
        data: showtimes,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
const getShowtimeById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const showtime = yield booking_model_1.Showtime.findById(id)
        .populate('movieId', 'title posterUrl duration genres')
        .populate({
        path: 'hallId',
        populate: {
            path: 'cinemaId',
            select: 'name address city phone facilities'
        }
    });
    if (!showtime) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Showtime not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Showtime retrieved successfully',
        data: showtime
    });
}));
const getAvailableSeats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // showtime id
    const showtime = yield booking_model_1.Showtime.findById(id).populate('hallId');
    if (!showtime) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Showtime not found',
            data: null
        });
    }
    // Get all seats for the hall
    const allSeats = yield booking_model_1.Seat.find({ hallId: showtime.hallId }).sort({ rowLabel: 1, seatNumber: 1 });
    // Mark booked seats
    const availableSeats = allSeats.map(seat => (Object.assign(Object.assign({}, seat.toObject()), { isBooked: showtime.bookedSeats.some(bookedSeat => bookedSeat.toString() === seat._id.toString()) })));
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Available seats retrieved successfully',
        data: {
            showtime: {
                _id: showtime._id,
                showDate: showtime.showDate,
                showTime: showtime.showTime,
                basePrice: showtime.basePrice
            },
            seats: availableSeats,
            totalSeats: allSeats.length,
            availableCount: showtime.availableSeats
        }
    });
}));
// BOOKING CONTROLLERS
const createBooking = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bookingData = req.body;
    // Validate showtime exists and has available seats
    const showtime = yield booking_model_1.Showtime.findById(bookingData.showtimeId);
    if (!showtime) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Showtime not found',
            data: null
        });
    }
    if (showtime.availableSeats < bookingData.selectedSeats.length) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Not enough available seats',
            data: null
        });
    }
    // Check if selected seats are already booked
    const seatIds = bookingData.selectedSeats.map((seat) => seat.seatId);
    const alreadyBookedSeats = seatIds.filter((seatId) => showtime.bookedSeats.some(bookedSeat => bookedSeat.toString() === seatId));
    if (alreadyBookedSeats.length > 0) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Some selected seats are already booked',
            data: null
        });
    }
    // Generate booking reference and set expiry
    bookingData.bookingReference = generateBookingReference();
    bookingData.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    const newBooking = yield booking_model_1.Booking.create(bookingData);
    // Update showtime with booked seats
    yield booking_model_1.Showtime.findByIdAndUpdate(bookingData.showtimeId, {
        $push: { bookedSeats: { $each: seatIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } },
        $inc: { availableSeats: -bookingData.selectedSeats.length }
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Booking created successfully',
        data: newBooking
    });
}));
const getAllBookings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, userId, showtimeId, paymentStatus, bookingStatus, startDate, endDate, sortBy = 'bookedAt', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (userId)
        filter.userId = userId;
    if (showtimeId)
        filter.showtimeId = showtimeId;
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
    const bookings = yield booking_model_1.Booking.find(filter)
        .populate('userId', 'name email phone')
        .populate({
        path: 'showtimeId',
        populate: [
            { path: 'movieId', select: 'title posterUrl' },
            {
                path: 'hallId',
                populate: { path: 'cinemaId', select: 'name city' }
            }
        ]
    })
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield booking_model_1.Booking.countDocuments(filter);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Bookings retrieved successfully',
        data: bookings,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
const getBookingById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const booking = yield booking_model_1.Booking.findById(id)
        .populate('userId', 'name email phone')
        .populate({
        path: 'showtimeId',
        populate: [
            { path: 'movieId', select: 'title posterUrl duration genres' },
            {
                path: 'hallId',
                populate: { path: 'cinemaId', select: 'name address city phone' }
            }
        ]
    });
    if (!booking) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Booking not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Booking retrieved successfully',
        data: booking
    });
}));
const processPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // booking id
    const paymentData = req.body;
    const booking = yield booking_model_1.Booking.findById(id);
    if (!booking) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Booking not found',
            data: null
        });
    }
    if (booking.paymentStatus === 'completed') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Payment already completed',
            data: null
        });
    }
    // Create payment transaction record
    const transaction = yield booking_model_1.PaymentTransaction.create(Object.assign(Object.assign({ bookingId: id }, paymentData), { processedAt: new Date() }));
    // Update booking payment status
    const updatedBooking = yield booking_model_1.Booking.findByIdAndUpdate(id, {
        paymentStatus: 'completed',
        transactionId: paymentData.gatewayTransactionId
    }, { new: true });
    // Generate e-ticket
    const ticketNumber = generateTicketNumber();
    const qrData = JSON.stringify({
        bookingId: id,
        ticketNumber,
        showtime: booking.showtimeId,
        seats: booking.selectedSeats,
        generatedAt: new Date()
    });
    const qrCodeImageUrl = yield qrcode_1.default.toDataURL(qrData);
    const eTicket = yield booking_model_1.ETicket.create({
        bookingId: id,
        ticketNumber,
        qrCodeData: qrData,
        qrCodeImageUrl
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Payment processed successfully',
        data: {
            booking: updatedBooking,
            transaction,
            eTicket
        }
    });
}));
const cancelBooking = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const booking = yield booking_model_1.Booking.findById(id);
    if (!booking) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Booking not found',
            data: null
        });
    }
    if (booking.bookingStatus === 'cancelled') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Booking already cancelled',
            data: null
        });
    }
    // Update booking status
    const updatedBooking = yield booking_model_1.Booking.findByIdAndUpdate(id, { bookingStatus: 'cancelled' }, { new: true });
    // Release seats back to showtime
    const seatIds = booking.selectedSeats.map(seat => seat.seatId);
    yield booking_model_1.Showtime.findByIdAndUpdate(booking.showtimeId, {
        $pull: { bookedSeats: { $in: seatIds.map((id) => new mongoose_1.default.Types.ObjectId(id.toString())) } },
        $inc: { availableSeats: booking.selectedSeats.length }
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Booking cancelled successfully',
        data: updatedBooking
    });
}));
const getETicket = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // booking id
    const eTicket = yield booking_model_1.ETicket.findOne({ bookingId: id })
        .populate({
        path: 'bookingId',
        populate: [
            { path: 'userId', select: 'name email phone' },
            {
                path: 'showtimeId',
                populate: [
                    { path: 'movieId', select: 'title posterUrl duration' },
                    {
                        path: 'hallId',
                        populate: { path: 'cinemaId', select: 'name address city' }
                    }
                ]
            }
        ]
    });
    if (!eTicket) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'E-ticket not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'E-ticket retrieved successfully',
        data: eTicket
    });
}));
exports.BookingController = {
    // Cinema controllers
    createCinema,
    getAllCinemas,
    getCinemaById,
    updateCinema,
    deleteCinema,
    // Showtime controllers
    createShowtime,
    getAllShowtimes,
    getShowtimeById,
    getAvailableSeats,
    // Booking controllers
    createBooking,
    getAllBookings,
    getBookingById,
    processPayment,
    cancelBooking,
    getETicket
};
