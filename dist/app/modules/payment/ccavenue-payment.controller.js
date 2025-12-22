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
exports.CCAvenuePaymentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const ccavenueService_1 = __importDefault(require("../../services/ccavenueService"));
const watch_videos_model_1 = require("../watch-videos/watch-videos.model");
const event_booking_model_1 = require("../events/event-booking.model");
const events_model_1 = __importDefault(require("../events/events.model"));
const qrcode_1 = __importDefault(require("qrcode"));
// Generate unique ticket number
const generateTicketNumber = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `ETK${timestamp}${randomStr}`.toUpperCase();
};
// Generate unique ticket scanner ID
const generateTicketScannerId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    const checksum = Math.random().toString(36).substring(2, 4);
    return `SCAN${timestamp}${randomStr}${checksum}`.toUpperCase();
};
/**
 * Handle CCAvenue payment callback
 * This is called when CCAvenue redirects back after payment
 */
const handleCCAvenueCallback = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { encResp } = req.body;
    if (!encResp) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=no_response`);
    }
    try {
        // Process the encrypted response
        const ccResponse = ccavenueService_1.default.processCallbackResponse(encResp);
        const { success, orderId, trackingId, bankRefNo, orderStatus, failureMessage, merchantParam1: userId, merchantParam2: itemId, merchantParam3: paymentType, // 'video' or 'event'
        merchantParam4: purchaseType, merchantParam5: purchaseReference, amount, currency } = ccResponse;
        if (paymentType === 'video') {
            // Handle video purchase
            const purchase = yield watch_videos_model_1.VideoPurchase.findOne({ transactionId: orderId });
            if (!purchase) {
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=purchase_not_found`);
            }
            if (success && orderStatus === 'Success') {
                // Update purchase status
                purchase.paymentStatus = 'completed';
                yield purchase.save();
                // Update transaction
                yield watch_videos_model_1.VideoPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
                    status: 'completed',
                    gatewayResponse: ccResponse.rawResponse,
                    bankRefNo,
                    trackingId,
                });
                // Note: Vendor wallet credit is handled via webhook or manual process
                return res.redirect(`${process.env.FRONTEND_URL}/watch-movie-deatils?videoId=${itemId}&payment=success&order_id=${orderId}`);
            }
            else {
                // Payment failed
                purchase.paymentStatus = 'failed';
                yield purchase.save();
                yield watch_videos_model_1.VideoPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
                    status: 'failed',
                    gatewayResponse: ccResponse.rawResponse,
                    failureReason: failureMessage,
                });
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=${encodeURIComponent(failureMessage || 'Payment failed')}`);
            }
        }
        else if (paymentType === 'event') {
            // Handle event booking
            const booking = yield event_booking_model_1.EventBooking.findOne({ cashfreeOrderId: orderId });
            if (!booking) {
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=booking_not_found`);
            }
            if (success && orderStatus === 'Success') {
                // Update booking status
                booking.paymentStatus = 'completed';
                booking.bookingStatus = 'confirmed';
                yield booking.save();
                // Update transaction
                yield event_booking_model_1.EventPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
                    status: 'completed',
                    gatewayResponse: ccResponse.rawResponse,
                    bankRefNo,
                    trackingId,
                });
                // Generate e-tickets
                const event = yield events_model_1.default.findById(booking.eventId);
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
                    const qrCodeUrl = yield qrcode_1.default.toDataURL(qrData);
                    const eTicket = yield event_booking_model_1.EventETicket.create({
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
                        const seatType = event.seatTypes.find((st) => st.name.toLowerCase() === booking.seatType.toLowerCase());
                        if (seatType) {
                            seatType.availableSeats = Math.max(0, seatType.availableSeats - booking.quantity);
                        }
                    }
                    event.availableSeats = Math.max(0, event.availableSeats - booking.quantity);
                    yield event.save();
                    // Note: Vendor wallet credit is handled via webhook or manual process
                }
                return res.redirect(`${process.env.FRONTEND_URL}/events/booking-success?bookingId=${booking._id}&payment=success`);
            }
            else {
                // Payment failed
                booking.paymentStatus = 'failed';
                booking.bookingStatus = 'cancelled';
                yield booking.save();
                yield event_booking_model_1.EventPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
                    status: 'failed',
                    gatewayResponse: ccResponse.rawResponse,
                    failureReason: failureMessage,
                });
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=${encodeURIComponent(failureMessage || 'Payment failed')}`);
            }
        }
        // Unknown payment type
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=unknown_payment_type`);
    }
    catch (error) {
        console.error('CCAvenue callback error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=${encodeURIComponent(error.message || 'Processing error')}`);
    }
}));
/**
 * Handle CCAvenue cancel callback
 */
const handleCCAvenueCancelCallback = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { encResp } = req.body;
    if (encResp) {
        try {
            const ccResponse = ccavenueService_1.default.processCallbackResponse(encResp);
            const { orderId, merchantParam3: paymentType } = ccResponse;
            if (paymentType === 'video') {
                yield watch_videos_model_1.VideoPurchase.findOneAndUpdate({ transactionId: orderId }, { paymentStatus: 'cancelled' });
            }
            else if (paymentType === 'event') {
                yield event_booking_model_1.EventBooking.findOneAndUpdate({ cashfreeOrderId: orderId }, { paymentStatus: 'cancelled', bookingStatus: 'cancelled' });
            }
        }
        catch (error) {
            console.error('CCAvenue cancel callback error:', error);
        }
    }
    return res.redirect(`${process.env.FRONTEND_URL}/payment/cancelled`);
}));
/**
 * Get CCAvenue configuration status (for admin)
 */
const getConfigStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const status = ccavenueService_1.default.getConfigStatus();
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'CCAvenue configuration status',
        data: status,
    });
}));
exports.CCAvenuePaymentController = {
    handleCCAvenueCallback,
    handleCCAvenueCancelCallback,
    getConfigStatus,
};
