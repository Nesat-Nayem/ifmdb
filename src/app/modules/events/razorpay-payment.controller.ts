import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import Event from './events.model';
import { EventBooking, EventETicket, EventPaymentTransaction } from './event-booking.model';
import { WalletController } from '../wallet/wallet.controller';
import razorpayService from '../../services/razorpayService';

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

// Generate unique ticket scanner ID
const generateTicketScannerId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  const checksum = Math.random().toString(36).substring(2, 4);
  return `SCAN${timestamp}${randomStr}${checksum}`.toUpperCase();
};

// Create Razorpay order and booking
const createRazorpayOrder = catchAsync(async (req: Request, res: Response) => {
  const { id: eventId } = req.params;
  const { 
    userId, 
    quantity, 
    seatType = 'Normal',
    customerDetails,
    countryCode = 'IN'
  } = req.body;

  // Validate event
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
  } else if (event.availableSeats < quantity) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Not enough seats available',
      data: null,
    });
  }

  // Calculate amounts (no booking fee or GST)
  const totalAmount = unitPrice * quantity;
  const bookingFee = 0;
  const taxAmount = 0;
  const finalAmount = totalAmount;

  const bookingReference = generateBookingReference();
  
  // Get currency based on country code
  const currency = razorpayService.getCurrencyForCountry(countryCode);

  try {
    // Create Razorpay order
    const razorpayOrder = await razorpayService.createOrder({
      amount: finalAmount,
      currency: currency,
      receipt: bookingReference,
      notes: {
        eventId: eventId,
        userId: userId,
        quantity: quantity.toString(),
        seatType: seatType,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
      },
    });

    // Create booking with pending status
    const bookingData = {
      eventId: new mongoose.Types.ObjectId(eventId),
      userId: new mongoose.Types.ObjectId(userId),
      bookingReference,
      quantity,
      seatType,
      unitPrice,
      totalAmount,
      bookingFee,
      taxAmount,
      discountAmount: 0,
      finalAmount,
      paymentStatus: 'pending',
      bookingStatus: 'pending',
      paymentMethod: 'razorpay',
      cashfreeOrderId: razorpayOrder.id,
      transactionId: razorpayOrder.id,
      bookedAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      customerDetails,
    };

    const newBooking = await EventBooking.create(bookingData);

    // Record initial transaction
    await EventPaymentTransaction.create({
      bookingId: newBooking._id,
      paymentGateway: 'razorpay',
      gatewayTransactionId: razorpayOrder.id,
      amount: finalAmount,
      currency: currency,
      status: 'pending',
      paymentMethod: 'razorpay',
      gatewayResponse: razorpayOrder,
    });

    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Razorpay payment order created successfully',
      data: {
        booking: newBooking,
        paymentGateway: 'razorpay',
        razorpayOrder: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: razorpayService.getRazorpayKeyId(),
        },
        event: {
          id: event._id,
          title: event.title,
        }
      },
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to create payment order',
      data: error.message || null,
    });
  }
});

// Verify Razorpay payment
const verifyRazorpayPayment = catchAsync(async (req: Request, res: Response) => {
  const { orderId, paymentId, signature } = req.body;

  // Verify signature
  const isValid = razorpayService.verifyPaymentSignature(orderId, paymentId, signature);

  if (!isValid) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid payment signature',
      data: null,
    });
  }

  try {
    // Fetch payment details from Razorpay
    const payment = await razorpayService.fetchPayment(paymentId);

    // Find booking by order ID
    const booking = await EventBooking.findOne({ 
      $or: [
        { cashfreeOrderId: orderId },
        { transactionId: orderId }
      ]
    });

    if (!booking) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Booking not found',
        data: null,
      });
    }

    // Update transaction record
    await EventPaymentTransaction.findOneAndUpdate(
      { gatewayTransactionId: orderId },
      {
        status: payment.status === 'captured' ? 'completed' : payment.status,
        gatewayResponse: payment,
        processedAt: new Date(),
      }
    );

    if (payment.status === 'captured') {
      // Update booking to completed
      booking.paymentStatus = 'completed';
      booking.bookingStatus = 'confirmed';
      await booking.save();

      // Update event seat availability
      const event = await Event.findById(booking.eventId);
      if (event) {
        if (event.seatTypes && event.seatTypes.length > 0) {
          const seatType = (event.seatTypes as any[]).find(
            (st: any) => st.name.toLowerCase() === (booking as any).seatType.toLowerCase()
          );
          if (seatType) {
            seatType.availableSeats = Math.max(0, seatType.availableSeats - (booking as any).quantity);
          }
        }
        (event as any).availableSeats = Math.max(0, (event as any).availableSeats - (booking as any).quantity);
        (event as any).totalTicketsSold = ((event as any).totalTicketsSold || 0) + (booking as any).quantity;
        await event.save();
      }

      // Generate e-tickets
      const eTickets = [];
      for (let i = 0; i < booking.quantity; i++) {
        const ticketNumber = generateTicketNumber();
        const ticketScannerId = generateTicketScannerId();
        const qrData = JSON.stringify({
          ticketNumber,
          ticketScannerId,
          bookingId: booking._id,
          eventId: booking.eventId,
          userId: booking.userId,
        });
        const qrCodeUrl = await QRCode.toDataURL(qrData);

        const eTicket = await EventETicket.create({
          bookingId: booking._id,
          ticketNumber,
          ticketScannerId,
          qrCodeData: qrData,
          qrCodeImageUrl: qrCodeUrl,
          quantity: 1,
        });
        eTickets.push(eTicket);
      }

      // Credit vendor wallet if event has a vendor
      const eventData = event as any;
      if (eventData && eventData.vendorId) {
        try {
          await WalletController.creditVendorEarnings({
            vendorId: eventData.vendorId.toString(),
            amount: booking.finalAmount,
            serviceType: 'events',
            referenceType: 'event_booking',
            referenceId: (booking._id as mongoose.Types.ObjectId).toString(),
            isGovernmentEvent: eventData.isGovernmentEvent || false, // Government events have fixed 10% fee
            metadata: {
              bookingId: (booking._id as mongoose.Types.ObjectId).toString(),
              customerName: booking.customerDetails?.name,
              customerEmail: booking.customerDetails?.email,
              itemTitle: event?.title || '',
            },
          });
        } catch (walletError) {
          console.error('Failed to credit vendor wallet:', walletError);
        }
      }

      // Populate booking with event details
      const populatedBooking = await EventBooking.findById(booking._id)
        .populate('eventId', 'title posterImage startDate startTime endTime location')
        .populate('userId', 'name email phone');

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment verified successfully',
        data: {
          booking: populatedBooking,
          eTickets,
          paymentStatus: 'completed',
        },
      });
    } else {
      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment is being processed',
        data: {
          paymentStatus: payment.status,
        },
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to verify payment',
      data: null,
    });
  }
});

// Razorpay Webhook handler
const handleRazorpayWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  // Verify webhook signature
  const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);

  if (!isValid) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;
    
    // Find and update booking
    const booking = await EventBooking.findOne({ 
      $or: [
        { cashfreeOrderId: orderId },
        { transactionId: orderId }
      ]
    });

    if (booking && booking.paymentStatus !== 'completed') {
      booking.paymentStatus = 'completed';
      booking.bookingStatus = 'confirmed';
      await booking.save();

      // Update event availability
      const eventDoc = await Event.findById(booking.eventId);
      if (eventDoc) {
        if (eventDoc.seatTypes && eventDoc.seatTypes.length > 0) {
          await Event.findOneAndUpdate(
            { 
              _id: booking.eventId, 
              'seatTypes.name': booking.seatType,
            },
            { 
              $inc: { 
                'seatTypes.$.availableSeats': -booking.quantity,
                availableSeats: -booking.quantity,
                totalTicketsSold: booking.quantity,
              } 
            }
          );
        } else {
          await Event.findByIdAndUpdate(booking.eventId, {
            $inc: { 
              availableSeats: -booking.quantity, 
              totalTicketsSold: booking.quantity,
            },
          });
        }
      }

      // Generate e-ticket if not exists
      const existingTicket = await EventETicket.findOne({ bookingId: booking._id });
      if (!existingTicket) {
        for (let i = 0; i < booking.quantity; i++) {
          const ticketNumber = generateTicketNumber();
          const ticketScannerId = generateTicketScannerId();
          
          const qrData = JSON.stringify({
            ticketScannerId,
            bookingId: booking._id,
            ticketNumber,
            eventId: booking.eventId,
            quantity: booking.quantity,
            seatType: booking.seatType,
            generatedAt: new Date(),
          });

          const qrCodeImageUrl = await QRCode.toDataURL(qrData);

          await EventETicket.create({
            bookingId: booking._id,
            ticketNumber,
            ticketScannerId,
            qrCodeData: qrData,
            qrCodeImageUrl,
            quantity: 1,
          });
        }
      }

      // Update transaction
      await EventPaymentTransaction.findOneAndUpdate(
        { gatewayTransactionId: orderId },
        {
          status: 'completed',
          gatewayResponse: payment,
          processedAt: new Date(),
        }
      );
    }
  } else if (event === 'payment.failed') {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;
    
    await EventBooking.findOneAndUpdate(
      { 
        $or: [
          { cashfreeOrderId: orderId },
          { transactionId: orderId }
        ]
      },
      { paymentStatus: 'failed', bookingStatus: 'cancelled' }
    );

    await EventPaymentTransaction.findOneAndUpdate(
      { gatewayTransactionId: orderId },
      {
        status: 'failed',
        gatewayResponse: payment,
        processedAt: new Date(),
      }
    );
  }

  return res.status(200).json({ received: true });
});

// Get payment status
const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const booking = await EventBooking.findOne({ 
    $or: [
      { cashfreeOrderId: orderId },
      { transactionId: orderId }
    ]
  })
    .populate('eventId', 'title posterImage startDate startTime endTime location')
    .populate('userId', 'name email phone');

  if (!booking) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Booking not found',
      data: null,
    });
  }

  let eTicket = null;
  if (booking.paymentStatus === 'completed') {
    eTicket = await EventETicket.findOne({ bookingId: booking._id });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment status retrieved',
    data: {
      booking,
      eTicket,
    },
  });
});

// Initiate refund
const initiateRefund = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const booking = await EventBooking.findById(bookingId);
  if (!booking) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Booking not found',
      data: null,
    });
  }

  if (booking.paymentStatus !== 'completed') {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Cannot refund - payment not completed',
      data: null,
    });
  }

  try {
    // Get the payment ID from transaction
    const transaction = await EventPaymentTransaction.findOne({ 
      bookingId: booking._id,
      status: 'completed'
    });

    if (!transaction || !transaction.gatewayResponse) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Payment transaction not found',
        data: null,
      });
    }

    // Get payment ID from gateway response
    const paymentId = (transaction.gatewayResponse as any).id;

    const refund = await razorpayService.refundPayment(
      paymentId,
      booking.finalAmount,
      { reason: reason || 'Customer requested refund' }
    );

    // Update booking status
    booking.paymentStatus = 'refunded';
    booking.bookingStatus = 'cancelled';
    await booking.save();

    // Release seats back
    const event = await Event.findById(booking.eventId);
    if (event) {
      if (event.seatTypes && event.seatTypes.length > 0) {
        await Event.findOneAndUpdate(
          { 
            _id: booking.eventId, 
            'seatTypes.name': booking.seatType,
          },
          { 
            $inc: { 
              'seatTypes.$.availableSeats': booking.quantity,
              availableSeats: booking.quantity,
              totalTicketsSold: -booking.quantity,
            } 
          }
        );
      } else {
        await Event.findByIdAndUpdate(booking.eventId, {
          $inc: { 
            availableSeats: booking.quantity, 
            totalTicketsSold: -booking.quantity,
          },
        });
      }
    }

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Refund initiated successfully',
      data: refund,
    });
  } catch (error: any) {
    console.error('Refund error:', error);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to initiate refund',
      data: error.message || null,
    });
  }
});

export const RazorpayPaymentController = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  getPaymentStatus,
  initiateRefund,
};
