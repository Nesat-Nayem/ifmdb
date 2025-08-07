import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { Cinema, CinemaHall, Seat, Showtime, Booking, ETicket, PaymentTransaction } from './booking.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import QRCode from 'qrcode';

// Generate unique booking reference
const generateBookingReference = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `BK${timestamp}${randomStr}`.toUpperCase();
};

// Generate unique ticket number
const generateTicketNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `TK${timestamp}${randomStr}`.toUpperCase();
};

// CINEMA CONTROLLERS
const createCinema = catchAsync(async (req: Request, res: Response) => {
  const cinemaData = req.body;
  const newCinema = await Cinema.create(cinemaData);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Cinema created successfully',
    data: newCinema
  });
});

const getAllCinemas = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    city,
    search,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const filter: any = { isActive: true };

  if (city) filter.city = { $regex: city, $options: 'i' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } }
    ];
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const cinemas = await Cinema.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Cinema.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

const getCinemaById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const cinema = await Cinema.findById(id);
  
  if (!cinema) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Cinema not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cinema retrieved successfully',
    data: cinema
  });
});

const updateCinema = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const updatedCinema = await Cinema.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!updatedCinema) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Cinema not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cinema updated successfully',
    data: updatedCinema
  });
});

const deleteCinema = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const deletedCinema = await Cinema.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  
  if (!deletedCinema) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Cinema not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cinema deleted successfully',
    data: deletedCinema
  });
});

// SHOWTIME CONTROLLERS
const createShowtime = catchAsync(async (req: Request, res: Response) => {
  const showtimeData = req.body;
  
  // Get hall details to set available seats
  const hall = await CinemaHall.findById(showtimeData.hallId);
  if (!hall) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Cinema hall not found',
      data: null
    });
  }

  if (!showtimeData.availableSeats) {
    showtimeData.availableSeats = hall.totalSeats;
  }

  const newShowtime = await Showtime.create(showtimeData);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Showtime created successfully',
    data: newShowtime
  });
});

const getAllShowtimes = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    movieId,
    cinemaId,
    hallId,
    showDate,
    language,
    formatType,
    city,
    status,
    sortBy = 'showTime',
    sortOrder = 'asc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const filter: any = { isActive: true };

  if (movieId) filter.movieId = movieId;
  if (hallId) filter.hallId = hallId;
  if (language) filter.language = { $regex: language, $options: 'i' };
  if (formatType) filter.formatType = formatType;
  if (status) filter.status = status;

  if (showDate) {
    const date = new Date(showDate as string);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    filter.showDate = { $gte: date, $lt: nextDate };
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  let showtimes = await Showtime.find(filter)
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
    showtimes = showtimes.filter((showtime: any) => 
      showtime.hallId?.cinemaId?.city?.toLowerCase().includes((city as string).toLowerCase())
    );
  }

  const total = await Showtime.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

const getShowtimeById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const showtime = await Showtime.findById(id)
    .populate('movieId', 'title posterUrl duration genres')
    .populate({
      path: 'hallId',
      populate: {
        path: 'cinemaId',
        select: 'name address city phone facilities'
      }
    });
  
  if (!showtime) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Showtime not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Showtime retrieved successfully',
    data: showtime
  });
});

const getAvailableSeats = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // showtime id
  
  const showtime = await Showtime.findById(id).populate('hallId');
  if (!showtime) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Showtime not found',
      data: null
    });
  }

  // Get all seats for the hall
  const allSeats = await Seat.find({ hallId: showtime.hallId }).sort({ rowLabel: 1, seatNumber: 1 });
  
  // Mark booked seats
  const availableSeats = allSeats.map(seat => ({
    ...seat.toObject(),
    isBooked: showtime.bookedSeats.some(bookedSeat => bookedSeat.toString() === (seat._id as mongoose.Types.ObjectId).toString())
  }));

  sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

// BOOKING CONTROLLERS
const createBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingData = req.body;
  
  // Validate showtime exists and has available seats
  const showtime = await Showtime.findById(bookingData.showtimeId);
  if (!showtime) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Showtime not found',
      data: null
    });
  }

  if (showtime.availableSeats < bookingData.selectedSeats.length) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Not enough available seats',
      data: null
    });
  }

  // Check if selected seats are already booked
  const seatIds = bookingData.selectedSeats.map((seat: any) => seat.seatId);
  const alreadyBookedSeats = seatIds.filter((seatId: string) => 
    showtime.bookedSeats.some(bookedSeat => bookedSeat.toString() === seatId)
  );

  if (alreadyBookedSeats.length > 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Some selected seats are already booked',
      data: null
    });
  }

  // Generate booking reference and set expiry
  bookingData.bookingReference = generateBookingReference();
  bookingData.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  const newBooking = await Booking.create(bookingData);

  // Update showtime with booked seats
  await Showtime.findByIdAndUpdate(bookingData.showtimeId, {
    $push: { bookedSeats: { $each: seatIds.map((id: string) => new mongoose.Types.ObjectId(id)) } },
    $inc: { availableSeats: -bookingData.selectedSeats.length }
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Booking created successfully',
    data: newBooking
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    userId,
    showtimeId,
    paymentStatus,
    bookingStatus,
    startDate,
    endDate,
    sortBy = 'bookedAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const filter: any = {};

  if (userId) filter.userId = userId;
  if (showtimeId) filter.showtimeId = showtimeId;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (bookingStatus) filter.bookingStatus = bookingStatus;

  if (startDate || endDate) {
    filter.bookedAt = {};
    if (startDate) filter.bookedAt.$gte = new Date(startDate as string);
    if (endDate) filter.bookedAt.$lte = new Date(endDate as string);
  }

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const bookings = await Booking.find(filter)
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

  const total = await Booking.countDocuments(filter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const booking = await Booking.findById(id)
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
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Booking not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking retrieved successfully',
    data: booking
  });
});

const processPayment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // booking id
  const paymentData = req.body;
  
  const booking = await Booking.findById(id);
  if (!booking) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Booking not found',
      data: null
    });
  }

  if (booking.paymentStatus === 'completed') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Payment already completed',
      data: null
    });
  }

  // Create payment transaction record
  const transaction = await PaymentTransaction.create({
    bookingId: id,
    ...paymentData,
    processedAt: new Date()
  });

  // Update booking payment status
  const updatedBooking = await Booking.findByIdAndUpdate(
    id,
    {
      paymentStatus: 'completed',
      transactionId: paymentData.gatewayTransactionId
    },
    { new: true }
  );

  // Generate e-ticket
  const ticketNumber = generateTicketNumber();
  const qrData = JSON.stringify({
    bookingId: id,
    ticketNumber,
    showtime: booking.showtimeId,
    seats: booking.selectedSeats,
    generatedAt: new Date()
  });

  const qrCodeImageUrl = await QRCode.toDataURL(qrData);

  const eTicket = await ETicket.create({
    bookingId: id,
    ticketNumber,
    qrCodeData: qrData,
    qrCodeImageUrl
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment processed successfully',
    data: {
      booking: updatedBooking,
      transaction,
      eTicket
    }
  });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const booking = await Booking.findById(id);
  if (!booking) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Booking not found',
      data: null
    });
  }

  if (booking.bookingStatus === 'cancelled') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Booking already cancelled',
      data: null
    });
  }

  // Update booking status
  const updatedBooking = await Booking.findByIdAndUpdate(
    id,
    { bookingStatus: 'cancelled' },
    { new: true }
  );

  // Release seats back to showtime
  const seatIds = booking.selectedSeats.map(seat => seat.seatId);
  await Showtime.findByIdAndUpdate(booking.showtimeId, {
    $pull: { bookedSeats: { $in: seatIds.map((id: any) => new mongoose.Types.ObjectId(id.toString())) } },
    $inc: { availableSeats: booking.selectedSeats.length }
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking cancelled successfully',
    data: updatedBooking
  });
});

const getETicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // booking id
  
  const eTicket = await ETicket.findOne({ bookingId: id })
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
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'E-ticket not found',
      data: null
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'E-ticket retrieved successfully',
    data: eTicket
  });
});

export const BookingController = {
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
