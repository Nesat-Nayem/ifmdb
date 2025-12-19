import { Request, Response } from 'express';
import httpStatus from 'http-status';
import axios from 'axios';
import crypto from 'crypto';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import Event from './events.model';
import { EventBooking, EventETicket, EventPaymentTransaction } from './event-booking.model';
import { WalletController } from '../wallet/wallet.controller';

// Cashfree API Configuration
const CASHFREE_API_URL = process.env.CASHFREE_ENV === 'production' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// Generate unique booking reference
const generateBookingReference = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `EBK${timestamp}${randomStr}`.toUpperCase();
};

// Generate unique order ID for Cashfree
const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `ORD${timestamp}${randomStr}`.toUpperCase();
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

// Create Cashfree order and booking
const createCashfreeOrder = catchAsync(async (req: Request, res: Response) => {
  const { id: eventId } = req.params;
  const { 
    userId, 
    quantity, 
    seatType = 'Normal',
    customerDetails,
    returnUrl
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

  // Calculate amounts
  const totalAmount = unitPrice * quantity;
  const bookingFee = Math.round(totalAmount * 0.02); // 2% booking fee
  const taxAmount = Math.round(totalAmount * 0.18); // 18% GST
  const finalAmount = totalAmount + bookingFee + taxAmount;

  const bookingReference = generateBookingReference();
  const orderId = generateOrderId();

  // Create Cashfree order
  try {
    const cashfreeResponse = await axios.post(
      `${CASHFREE_API_URL}/orders`,
      {
        order_id: orderId,
        order_amount: finalAmount,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_name: customerDetails.name,
          customer_email: customerDetails.email,
          customer_phone: customerDetails.phone,
        },
        order_meta: {
          return_url: returnUrl || `${process.env.FRONTEND_URL}/events/checkout/success?order_id={order_id}`,
          notify_url: `${process.env.BACKEND_URL}/v1/api/events/payment/webhook`,
        },
        order_note: `Event: ${event.title} | Tickets: ${quantity} x ${seatType}`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
        },
      }
    );

    const cashfreeOrder = cashfreeResponse.data;

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
      bookingStatus: 'confirmed',
      paymentMethod: 'cashfree',
      transactionId: orderId,
      bookedAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      customerDetails,
    };

    const newBooking = await EventBooking.create(bookingData);

    // Record initial transaction
    await EventPaymentTransaction.create({
      bookingId: newBooking._id,
      paymentGateway: 'cashfree',
      gatewayTransactionId: orderId,
      amount: finalAmount,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'cashfree',
      gatewayResponse: cashfreeOrder,
    });

    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Payment order created successfully',
      data: {
        booking: newBooking,
        cashfreeOrder: {
          orderId: cashfreeOrder.order_id,
          orderToken: cashfreeOrder.order_token,
          paymentSessionId: cashfreeOrder.payment_session_id,
          orderStatus: cashfreeOrder.order_status,
          cfOrderId: cashfreeOrder.cf_order_id,
        },
        paymentLink: cashfreeOrder.payment_link,
      },
    });
  } catch (error: any) {
    console.error('Cashfree order creation error:', error.response?.data || error.message);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to create payment order',
      data: error.response?.data || null,
    });
  }
});

// Verify Cashfree payment
const verifyCashfreePayment = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    // Fetch order status from Cashfree
    const cashfreeResponse = await axios.get(
      `${CASHFREE_API_URL}/orders/${orderId}`,
      {
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
        },
      }
    );

    const orderDetails = cashfreeResponse.data;

    // Find booking by transaction ID (order ID)
    const booking = await EventBooking.findOne({ transactionId: orderId });
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
        status: orderDetails.order_status === 'PAID' ? 'success' : orderDetails.order_status.toLowerCase(),
        gatewayResponse: orderDetails,
        processedAt: new Date(),
      }
    );

    if (orderDetails.order_status === 'PAID') {
      // Update booking to completed
      booking.paymentStatus = 'completed';
      await booking.save();

      // Update event seat availability
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

      // Generate e-ticket
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

      const eTicket = await EventETicket.create({
        bookingId: booking._id,
        ticketNumber,
        ticketScannerId,
        qrCodeData: qrData,
        qrCodeImageUrl,
        quantity: booking.quantity,
      });

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
          eTicket,
          paymentStatus: 'completed',
        },
      });
    } else if (orderDetails.order_status === 'ACTIVE') {
      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment is still pending',
        data: {
          paymentStatus: 'pending',
          orderStatus: orderDetails.order_status,
        },
      });
    } else {
      // Payment failed
      booking.paymentStatus = 'failed';
      await booking.save();

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: false,
        message: 'Payment failed',
        data: {
          paymentStatus: 'failed',
          orderStatus: orderDetails.order_status,
        },
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error.response?.data || error.message);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to verify payment',
      data: null,
    });
  }
});

// Cashfree Webhook handler
const handleCashfreeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;
  const rawBody = JSON.stringify(req.body);

  // Verify webhook signature
  const signatureData = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac('sha256', CASHFREE_SECRET_KEY!)
    .update(signatureData)
    .digest('base64');

  if (signature !== expectedSignature) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const { data, type } = req.body;

  if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
    const orderId = data.order.order_id;
    
    // Find and update booking
    const booking = await EventBooking.findOne({ transactionId: orderId });
    if (booking && booking.paymentStatus !== 'completed') {
      booking.paymentStatus = 'completed';
      await booking.save();

      // Update event availability
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
          quantity: booking.quantity,
        });
      }

      // Update transaction
      await EventPaymentTransaction.findOneAndUpdate(
        { gatewayTransactionId: orderId },
        {
          status: 'success',
          gatewayResponse: data,
          processedAt: new Date(),
        }
      );
    }
  } else if (type === 'PAYMENT_FAILED_WEBHOOK') {
    const orderId = data.order.order_id;
    
    await EventBooking.findOneAndUpdate(
      { transactionId: orderId },
      { paymentStatus: 'failed' }
    );

    await EventPaymentTransaction.findOneAndUpdate(
      { gatewayTransactionId: orderId },
      {
        status: 'failed',
        gatewayResponse: data,
        processedAt: new Date(),
      }
    );
  }

  return res.status(200).json({ received: true });
});

// Get payment status
const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const booking = await EventBooking.findOne({ transactionId: orderId })
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
    const refundId = `REF${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

    const refundResponse = await axios.post(
      `${CASHFREE_API_URL}/orders/${booking.transactionId}/refunds`,
      {
        refund_id: refundId,
        refund_amount: booking.finalAmount,
        refund_note: reason || 'Customer requested refund',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
        },
      }
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
      data: refundResponse.data,
    });
  } catch (error: any) {
    console.error('Refund error:', error.response?.data || error.message);
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Failed to initiate refund',
      data: error.response?.data || null,
    });
  }
});

export const CashfreePaymentController = {
  createCashfreeOrder,
  verifyCashfreePayment,
  handleCashfreeWebhook,
  getPaymentStatus,
  initiateRefund,
};
