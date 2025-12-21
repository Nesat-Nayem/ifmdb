import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import ccavenueService from '../../services/ccavenueService';
import { VideoPurchase, VideoPaymentTransaction, WatchVideo } from '../watch-videos/watch-videos.model';
import { EventBooking, EventPaymentTransaction, EventETicket } from '../events/event-booking.model';
import Event from '../events/events.model';
import QRCode from 'qrcode';

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

/**
 * Handle CCAvenue payment callback
 * This is called when CCAvenue redirects back after payment
 */
const handleCCAvenueCallback = catchAsync(async (req: Request, res: Response) => {
  const { encResp } = req.body;

  if (!encResp) {
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=no_response`);
  }

  try {
    // Process the encrypted response
    const ccResponse = ccavenueService.processCallbackResponse(encResp);
    
    const {
      success,
      orderId,
      trackingId,
      bankRefNo,
      orderStatus,
      failureMessage,
      merchantParam1: userId,
      merchantParam2: itemId,
      merchantParam3: paymentType, // 'video' or 'event'
      merchantParam4: purchaseType,
      merchantParam5: purchaseReference,
      amount,
      currency
    } = ccResponse;

    if (paymentType === 'video') {
      // Handle video purchase
      const purchase = await VideoPurchase.findOne({ transactionId: orderId });
      
      if (!purchase) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=purchase_not_found`);
      }

      if (success && orderStatus === 'Success') {
        // Update purchase status
        purchase.paymentStatus = 'completed';
        await purchase.save();

        // Update transaction
        await VideoPaymentTransaction.findOneAndUpdate(
          { gatewayTransactionId: orderId },
          {
            status: 'completed',
            gatewayResponse: ccResponse.rawResponse,
            bankRefNo,
            trackingId,
          }
        );

        // Note: Vendor wallet credit is handled via webhook or manual process

        return res.redirect(
          `${process.env.FRONTEND_URL}/watch-movie-deatils?videoId=${itemId}&payment=success&order_id=${orderId}`
        );
      } else {
        // Payment failed
        purchase.paymentStatus = 'failed';
        await purchase.save();

        await VideoPaymentTransaction.findOneAndUpdate(
          { gatewayTransactionId: orderId },
          {
            status: 'failed',
            gatewayResponse: ccResponse.rawResponse,
            failureReason: failureMessage,
          }
        );

        return res.redirect(
          `${process.env.FRONTEND_URL}/payment/failed?error=${encodeURIComponent(failureMessage || 'Payment failed')}`
        );
      }
    } else if (paymentType === 'event') {
      // Handle event booking
      const booking = await EventBooking.findOne({ cashfreeOrderId: orderId });
      
      if (!booking) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=booking_not_found`);
      }

      if (success && orderStatus === 'Success') {
        // Update booking status
        booking.paymentStatus = 'completed';
        booking.bookingStatus = 'confirmed';
        await booking.save();

        // Update transaction
        await EventPaymentTransaction.findOneAndUpdate(
          { gatewayTransactionId: orderId },
          {
            status: 'completed',
            gatewayResponse: ccResponse.rawResponse,
            bankRefNo,
            trackingId,
          }
        );

        // Generate e-tickets
        const event = await Event.findById(booking.eventId);
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
            seatType: booking.seatType,
            qrCode: qrCodeUrl,
            status: 'active',
          });
          eTickets.push(eTicket);
        }

        // Update event seat availability
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
          await event.save();

          // Note: Vendor wallet credit is handled via webhook or manual process
        }

        return res.redirect(
          `${process.env.FRONTEND_URL}/events/booking-success?bookingId=${booking._id}&payment=success`
        );
      } else {
        // Payment failed
        booking.paymentStatus = 'failed';
        booking.bookingStatus = 'cancelled';
        await booking.save();

        await EventPaymentTransaction.findOneAndUpdate(
          { gatewayTransactionId: orderId },
          {
            status: 'failed',
            gatewayResponse: ccResponse.rawResponse,
            failureReason: failureMessage,
          }
        );

        return res.redirect(
          `${process.env.FRONTEND_URL}/payment/failed?error=${encodeURIComponent(failureMessage || 'Payment failed')}`
        );
      }
    }

    // Unknown payment type
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=unknown_payment_type`);
  } catch (error: any) {
    console.error('CCAvenue callback error:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/failed?error=${encodeURIComponent(error.message || 'Processing error')}`
    );
  }
});

/**
 * Handle CCAvenue cancel callback
 */
const handleCCAvenueCancelCallback = catchAsync(async (req: Request, res: Response) => {
  const { encResp } = req.body;

  if (encResp) {
    try {
      const ccResponse = ccavenueService.processCallbackResponse(encResp);
      const { orderId, merchantParam3: paymentType } = ccResponse;

      if (paymentType === 'video') {
        await VideoPurchase.findOneAndUpdate(
          { transactionId: orderId },
          { paymentStatus: 'cancelled' }
        );
      } else if (paymentType === 'event') {
        await EventBooking.findOneAndUpdate(
          { cashfreeOrderId: orderId },
          { paymentStatus: 'cancelled', bookingStatus: 'cancelled' }
        );
      }
    } catch (error) {
      console.error('CCAvenue cancel callback error:', error);
    }
  }

  return res.redirect(`${process.env.FRONTEND_URL}/payment/cancelled`);
});

/**
 * Get CCAvenue configuration status (for admin)
 */
const getConfigStatus = catchAsync(async (req: Request, res: Response) => {
  const status = ccavenueService.getConfigStatus();
  
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'CCAvenue configuration status',
    data: status,
  });
});

export const CCAvenuePaymentController = {
  handleCCAvenueCallback,
  handleCCAvenueCancelCallback,
  getConfigStatus,
};
