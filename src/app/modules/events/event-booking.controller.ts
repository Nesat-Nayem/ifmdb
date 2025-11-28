import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import Event from './events.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { EventBooking, EventETicket, EventPaymentTransaction } from './event-booking.model';

// Generate unique booking reference
const generateBookingReference = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `EBK${timestamp}${randomStr}`.toUpperCase();
};

// Generate unique ticket number
const generateTicketNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `ETK${timestamp}${randomStr}`.toUpperCase();
};

// Create event ticket booking with seat type selection
const createEventBooking = catchAsync(async (req: Request, res: Response) => {
  const { id: eventId } = req.params;
  const { 
    userId, 
    quantity, 
    seatType = 'Normal',
    bookingFee = 0, 
    taxAmount = 0, 
    discountAmount = 0, 
    paymentMethod = 'card', 
    customerDetails 
  } = req.body;

  const event = await Event.findById(eventId);
  if (!event || !event.isActive || !['upcoming', 'ongoing'].includes(event.status)) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event not available for booking',
      data: null,
    });
  }

  // Check max tickets per person
  if (quantity > event.maxTicketsPerPerson) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: `Maximum ${event.maxTicketsPerPerson} tickets allowed per person`,
      data: null,
    });
  }

  let unitPrice = event.ticketPrice;
  let updateQuery: any = { $inc: { availableSeats: -quantity, totalTicketsSold: quantity } };

  // If event has seat types, find the matching seat type
  if (event.seatTypes && event.seatTypes.length > 0) {
    const selectedSeatType = event.seatTypes.find(st => st.name.toLowerCase() === seatType.toLowerCase());
    
    if (!selectedSeatType) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: `Seat type "${seatType}" not found for this event`,
        data: null,
      });
    }

    if (selectedSeatType.availableSeats < quantity) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: `Not enough ${seatType} seats available`,
        data: null,
      });
    }

    unitPrice = selectedSeatType.price;
    
    // Update the specific seat type's available seats
    const updatedEvent = await Event.findOneAndUpdate(
      { 
        _id: eventId, 
        'seatTypes.name': seatType,
        'seatTypes.availableSeats': { $gte: quantity }
      },
      { 
        $inc: { 
          'seatTypes.$.availableSeats': -quantity,
          availableSeats: -quantity,
          totalTicketsSold: quantity
        } 
      },
      { new: true }
    );

    if (!updatedEvent) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Not enough available tickets',
        data: null,
      });
    }
  } else {
    // Attempt atomic decrement of available seats (for events without seat types)
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, availableSeats: { $gte: quantity } },
      updateQuery,
      { new: true }
    );

    if (!updatedEvent) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Not enough available tickets',
        data: null,
      });
    }
  }

  const totalAmount = unitPrice * quantity;
  const finalAmount = totalAmount + bookingFee + taxAmount - discountAmount;

  const bookingData = {
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
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

  const newBooking = await EventBooking.create(bookingData);

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event booking created successfully',
    data: newBooking,
  });
});

const getAllEventBookings = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    userId,
    eventId,
    paymentStatus,
    bookingStatus,
    startDate,
    endDate,
    sortBy = 'bookedAt',
    sortOrder = 'desc',
  } = req.query as Record<string, string>;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const filter: any = {};
  if (userId) filter.userId = userId;
  if (eventId) filter.eventId = eventId;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (bookingStatus) filter.bookingStatus = bookingStatus;

  if (startDate || endDate) {
    filter.bookedAt = {};
    if (startDate) filter.bookedAt.$gte = new Date(startDate);
    if (endDate) filter.bookedAt.$lte = new Date(endDate);
  }

  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const bookings = await EventBooking.find(filter)
    .populate('userId', 'name email phone')
    .populate('eventId', 'title posterImage startDate startTime location ticketPrice')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await EventBooking.countDocuments(filter);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

const getEventBookingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const booking = await EventBooking.findById(id)
    .populate('userId', 'name email phone')
    .populate('eventId', 'title posterImage startDate startTime location ticketPrice');

  if (!booking) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event booking not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event booking retrieved successfully',
    data: booking,
  });
});

const processEventPayment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // booking id
  const paymentData = req.body;

  const booking = await EventBooking.findById(id);
  if (!booking) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event booking not found',
      data: null,
    });
  }

  if (booking.paymentStatus === 'completed') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Payment already completed',
      data: null,
    });
  }

  // Record transaction
  const transaction = await EventPaymentTransaction.create({
    bookingId: id,
    ...paymentData,
    processedAt: new Date(),
  });

  // Update booking
  const updatedBooking = await EventBooking.findByIdAndUpdate(
    id,
    { paymentStatus: 'completed', transactionId: paymentData.gatewayTransactionId },
    { new: true }
  );

  // Generate e-ticket
  const ticketNumber = generateTicketNumber();
  const qrData = JSON.stringify({
    bookingId: id,
    ticketNumber,
    eventId: booking.eventId,
    quantity: booking.quantity,
    generatedAt: new Date(),
  });

  const qrCodeImageUrl = await QRCode.toDataURL(qrData);

  const eTicket = await EventETicket.create({
    bookingId: id,
    ticketNumber,
    qrCodeData: qrData,
    qrCodeImageUrl,
    quantity: booking.quantity,
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event payment processed successfully',
    data: {
      booking: updatedBooking,
      transaction,
      eTicket,
    },
  });
});

const cancelEventBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const booking = await EventBooking.findById(id);
  if (!booking) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Event booking not found',
      data: null,
    });
  }

  if (booking.bookingStatus === 'cancelled') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Booking already cancelled',
      data: null,
    });
  }

  // Update booking status
  const updatedBooking = await EventBooking.findByIdAndUpdate(
    id,
    { bookingStatus: 'cancelled' },
    { new: true }
  );

  // Release tickets back to event availability
  await Event.findByIdAndUpdate(booking.eventId, { $inc: { availableSeats: booking.quantity } });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event booking cancelled successfully',
    data: updatedBooking,
  });
});

const getEventETicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // booking id

  const eTicket = await EventETicket.findOne({ bookingId: id })
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'userId', select: 'name email phone' },
        { path: 'eventId', select: 'title posterImage startDate startTime location' },
      ],
    });

  if (!eTicket) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'E-ticket not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'E-ticket retrieved successfully',
    data: eTicket,
  });
});

export const EventBookingController = {
  createEventBooking,
  getAllEventBookings,
  getEventBookingById,
  processEventPayment,
  cancelEventBooking,
  getEventETicket,
};
