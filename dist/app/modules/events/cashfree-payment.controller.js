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
exports.CashfreePaymentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const qrcode_1 = __importDefault(require("qrcode"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const events_model_1 = __importDefault(require("./events.model"));
const event_booking_model_1 = require("./event-booking.model");
// Cashfree API Configuration
const CASHFREE_API_URL = process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
// Generate unique booking reference
const generateBookingReference = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `EBK${timestamp}${randomStr}`.toUpperCase();
};
// Generate unique order ID for Cashfree
const generateOrderId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `ORD${timestamp}${randomStr}`.toUpperCase();
};
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
// Create Cashfree order and booking
const createCashfreeOrder = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id: eventId } = req.params;
    const { userId, quantity, seatType = 'Normal', customerDetails, returnUrl } = req.body;
    // Validate event
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
    }
    else if (event.availableSeats < quantity) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
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
        const cashfreeResponse = yield axios_1.default.post(`${CASHFREE_API_URL}/orders`, {
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
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
            },
        });
        const cashfreeOrder = cashfreeResponse.data;
        // Create booking with pending status
        const bookingData = {
            eventId: new mongoose_1.default.Types.ObjectId(eventId),
            userId: new mongoose_1.default.Types.ObjectId(userId),
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
        const newBooking = yield event_booking_model_1.EventBooking.create(bookingData);
        // Record initial transaction
        yield event_booking_model_1.EventPaymentTransaction.create({
            bookingId: newBooking._id,
            paymentGateway: 'cashfree',
            gatewayTransactionId: orderId,
            amount: finalAmount,
            currency: 'INR',
            status: 'pending',
            paymentMethod: 'cashfree',
            gatewayResponse: cashfreeOrder,
        });
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.CREATED,
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
    }
    catch (error) {
        console.error('Cashfree order creation error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to create payment order',
            data: ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || null,
        });
    }
}));
// Verify Cashfree payment
const verifyCashfreePayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { orderId } = req.params;
    try {
        // Fetch order status from Cashfree
        const cashfreeResponse = yield axios_1.default.get(`${CASHFREE_API_URL}/orders/${orderId}`, {
            headers: {
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
            },
        });
        const orderDetails = cashfreeResponse.data;
        // Find booking by transaction ID (order ID)
        const booking = yield event_booking_model_1.EventBooking.findOne({ transactionId: orderId });
        if (!booking) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.NOT_FOUND,
                success: false,
                message: 'Booking not found',
                data: null,
            });
        }
        // Update transaction record
        yield event_booking_model_1.EventPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
            status: orderDetails.order_status === 'PAID' ? 'success' : orderDetails.order_status.toLowerCase(),
            gatewayResponse: orderDetails,
            processedAt: new Date(),
        });
        if (orderDetails.order_status === 'PAID') {
            // Update booking to completed
            booking.paymentStatus = 'completed';
            yield booking.save();
            // Update event seat availability
            const event = yield events_model_1.default.findById(booking.eventId);
            if (event) {
                if (event.seatTypes && event.seatTypes.length > 0) {
                    yield events_model_1.default.findOneAndUpdate({
                        _id: booking.eventId,
                        'seatTypes.name': booking.seatType,
                    }, {
                        $inc: {
                            'seatTypes.$.availableSeats': -booking.quantity,
                            availableSeats: -booking.quantity,
                            totalTicketsSold: booking.quantity,
                        }
                    });
                }
                else {
                    yield events_model_1.default.findByIdAndUpdate(booking.eventId, {
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
            const qrCodeImageUrl = yield qrcode_1.default.toDataURL(qrData);
            const eTicket = yield event_booking_model_1.EventETicket.create({
                bookingId: booking._id,
                ticketNumber,
                ticketScannerId,
                qrCodeData: qrData,
                qrCodeImageUrl,
                quantity: booking.quantity,
            });
            // Populate booking with event details
            const populatedBooking = yield event_booking_model_1.EventBooking.findById(booking._id)
                .populate('eventId', 'title posterImage startDate startTime endTime location')
                .populate('userId', 'name email phone');
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Payment verified successfully',
                data: {
                    booking: populatedBooking,
                    eTicket,
                    paymentStatus: 'completed',
                },
            });
        }
        else if (orderDetails.order_status === 'ACTIVE') {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Payment is still pending',
                data: {
                    paymentStatus: 'pending',
                    orderStatus: orderDetails.order_status,
                },
            });
        }
        else {
            // Payment failed
            booking.paymentStatus = 'failed';
            yield booking.save();
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: false,
                message: 'Payment failed',
                data: {
                    paymentStatus: 'failed',
                    orderStatus: orderDetails.order_status,
                },
            });
        }
    }
    catch (error) {
        console.error('Payment verification error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to verify payment',
            data: null,
        });
    }
}));
// Cashfree Webhook handler
const handleCashfreeWebhook = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = JSON.stringify(req.body);
    // Verify webhook signature
    const signatureData = timestamp + rawBody;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', CASHFREE_SECRET_KEY)
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
        const booking = yield event_booking_model_1.EventBooking.findOne({ transactionId: orderId });
        if (booking && booking.paymentStatus !== 'completed') {
            booking.paymentStatus = 'completed';
            yield booking.save();
            // Update event availability
            const event = yield events_model_1.default.findById(booking.eventId);
            if (event) {
                if (event.seatTypes && event.seatTypes.length > 0) {
                    yield events_model_1.default.findOneAndUpdate({
                        _id: booking.eventId,
                        'seatTypes.name': booking.seatType,
                    }, {
                        $inc: {
                            'seatTypes.$.availableSeats': -booking.quantity,
                            availableSeats: -booking.quantity,
                            totalTicketsSold: booking.quantity,
                        }
                    });
                }
                else {
                    yield events_model_1.default.findByIdAndUpdate(booking.eventId, {
                        $inc: {
                            availableSeats: -booking.quantity,
                            totalTicketsSold: booking.quantity,
                        },
                    });
                }
            }
            // Generate e-ticket if not exists
            const existingTicket = yield event_booking_model_1.EventETicket.findOne({ bookingId: booking._id });
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
                const qrCodeImageUrl = yield qrcode_1.default.toDataURL(qrData);
                yield event_booking_model_1.EventETicket.create({
                    bookingId: booking._id,
                    ticketNumber,
                    ticketScannerId,
                    qrCodeData: qrData,
                    qrCodeImageUrl,
                    quantity: booking.quantity,
                });
            }
            // Update transaction
            yield event_booking_model_1.EventPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
                status: 'success',
                gatewayResponse: data,
                processedAt: new Date(),
            });
        }
    }
    else if (type === 'PAYMENT_FAILED_WEBHOOK') {
        const orderId = data.order.order_id;
        yield event_booking_model_1.EventBooking.findOneAndUpdate({ transactionId: orderId }, { paymentStatus: 'failed' });
        yield event_booking_model_1.EventPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
            status: 'failed',
            gatewayResponse: data,
            processedAt: new Date(),
        });
    }
    return res.status(200).json({ received: true });
}));
// Get payment status
const getPaymentStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const booking = yield event_booking_model_1.EventBooking.findOne({ transactionId: orderId })
        .populate('eventId', 'title posterImage startDate startTime endTime location')
        .populate('userId', 'name email phone');
    if (!booking) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Booking not found',
            data: null,
        });
    }
    let eTicket = null;
    if (booking.paymentStatus === 'completed') {
        eTicket = yield event_booking_model_1.EventETicket.findOne({ bookingId: booking._id });
    }
    return (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Payment status retrieved',
        data: {
            booking,
            eTicket,
        },
    });
}));
// Initiate refund
const initiateRefund = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { bookingId } = req.params;
    const { reason } = req.body;
    const booking = yield event_booking_model_1.EventBooking.findById(bookingId);
    if (!booking) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Booking not found',
            data: null,
        });
    }
    if (booking.paymentStatus !== 'completed') {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Cannot refund - payment not completed',
            data: null,
        });
    }
    try {
        const refundId = `REF${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
        const refundResponse = yield axios_1.default.post(`${CASHFREE_API_URL}/orders/${booking.transactionId}/refunds`, {
            refund_id: refundId,
            refund_amount: booking.finalAmount,
            refund_note: reason || 'Customer requested refund',
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
            },
        });
        // Update booking status
        booking.paymentStatus = 'refunded';
        booking.bookingStatus = 'cancelled';
        yield booking.save();
        // Release seats back
        const event = yield events_model_1.default.findById(booking.eventId);
        if (event) {
            if (event.seatTypes && event.seatTypes.length > 0) {
                yield events_model_1.default.findOneAndUpdate({
                    _id: booking.eventId,
                    'seatTypes.name': booking.seatType,
                }, {
                    $inc: {
                        'seatTypes.$.availableSeats': booking.quantity,
                        availableSeats: booking.quantity,
                        totalTicketsSold: -booking.quantity,
                    }
                });
            }
            else {
                yield events_model_1.default.findByIdAndUpdate(booking.eventId, {
                    $inc: {
                        availableSeats: booking.quantity,
                        totalTicketsSold: -booking.quantity,
                    },
                });
            }
        }
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Refund initiated successfully',
            data: refundResponse.data,
        });
    }
    catch (error) {
        console.error('Refund error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to initiate refund',
            data: ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || null,
        });
    }
}));
exports.CashfreePaymentController = {
    createCashfreeOrder,
    verifyCashfreePayment,
    handleCashfreeWebhook,
    getPaymentStatus,
    initiateRefund,
};
