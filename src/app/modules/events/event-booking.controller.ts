import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import Event from './events.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { EventBooking, EventETicket, EventPaymentTransaction } from './event-booking.model';
import { userInterface } from '../../middlewares/userInterface';

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

// Generate unique ticket scanner ID (for QR code scanning)
const generateTicketScannerId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  const checksum = Math.random().toString(36).substring(2, 4);
  return `SCAN${timestamp}${randomStr}${checksum}`.toUpperCase();
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
  const user = (req as userInterface).user;
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

  // Role-based filtering: Vendors only see bookings for their own events
  if (user && user.role === 'vendor') {
    const vendorEvents = await Event.find({ vendorId: user._id }).select('_id');
    const eventIds = vendorEvents.map(e => e._id);
    filter.eventId = { $in: eventIds };
  }

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

  const qrCodeImageUrl = await QRCode.toDataURL(qrData);

  const eTicket = await EventETicket.create({
    bookingId: id,
    ticketNumber,
    ticketScannerId,
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

// Validate/Scan ticket by scanner ID
const validateTicketByScannerId = catchAsync(async (req: Request, res: Response) => {
  const { scannerId } = req.params;
  const { scannedBy, scanLocation } = req.body;

  const eTicket = await EventETicket.findOne({ ticketScannerId: scannerId })
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'userId', select: 'name email phone' },
        { path: 'eventId', select: 'title posterImage startDate startTime endTime location status' },
      ],
    });

  if (!eTicket) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Invalid ticket - Ticket not found',
      data: null,
    });
  }

  // Check if ticket is already used
  if (eTicket.isUsed) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
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
  const booking = eTicket.bookingId as any;
  
  // Check if booking is valid
  if (booking.bookingStatus === 'cancelled') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Ticket booking has been cancelled',
      data: null,
    });
  }

  if (booking.paymentStatus !== 'completed') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Payment not completed for this ticket',
      data: null,
    });
  }

  // Check if event is valid
  const event = booking.eventId;
  if (!event || !['upcoming', 'ongoing'].includes(event.status)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Event is not active or has ended',
      data: null,
    });
  }

  // Mark ticket as used
  const updatedTicket = await EventETicket.findByIdAndUpdate(
    eTicket._id,
    {
      isUsed: true,
      usedAt: new Date(),
      scannedBy: scannedBy || null,
      scanLocation: scanLocation || '',
    },
    { new: true }
  ).populate({
    path: 'bookingId',
    populate: [
      { path: 'userId', select: 'name email phone' },
      { path: 'eventId', select: 'title posterImage startDate startTime endTime location' },
    ],
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Ticket validated successfully - Entry allowed',
    data: {
      ticketScannerId: updatedTicket?.ticketScannerId,
      ticketNumber: updatedTicket?.ticketNumber,
      quantity: updatedTicket?.quantity,
      isUsed: true,
      usedAt: updatedTicket?.usedAt,
      booking: updatedTicket?.bookingId,
    },
  });
});

// Check ticket status without marking as used
const checkTicketStatus = catchAsync(async (req: Request, res: Response) => {
  const { scannerId } = req.params;

  const eTicket = await EventETicket.findOne({ ticketScannerId: scannerId })
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'userId', select: 'name email phone' },
        { path: 'eventId', select: 'title posterImage startDate startTime endTime location status' },
      ],
    });

  if (!eTicket) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Ticket not found',
      data: null,
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
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
});

// Delete event booking
const deleteEventBooking = catchAsync(async (req: Request, res: Response) => {
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

  // Delete associated e-tickets
  await EventETicket.deleteMany({ bookingId: id });
  
  // Delete associated transactions
  await EventPaymentTransaction.deleteMany({ bookingId: id });

  // Release seats back if booking was confirmed
  if (booking.bookingStatus === 'confirmed') {
    await Event.findByIdAndUpdate(booking.eventId, { 
      $inc: { availableSeats: booking.quantity, totalTicketsSold: -booking.quantity } 
    });
  }

  // Delete the booking
  await EventBooking.findByIdAndDelete(id);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event booking deleted successfully',
    data: null,
  });
});

export const EventBookingController = {
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
