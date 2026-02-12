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
exports.RazorpayPaymentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importDefault(require("mongoose"));
const qrcode_1 = __importDefault(require("qrcode"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const events_model_1 = __importDefault(require("./events.model"));
const event_booking_model_1 = require("./event-booking.model");
const wallet_controller_1 = require("../wallet/wallet.controller");
const razorpayService_1 = __importDefault(require("../../services/razorpayService"));
const razorpayRouteService_1 = __importDefault(require("../../services/razorpayRouteService"));
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
// Generate unique ticket scanner ID
const generateTicketScannerId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    const checksum = Math.random().toString(36).substring(2, 4);
    return `SCAN${timestamp}${randomStr}${checksum}`.toUpperCase();
};
// Create Razorpay order and booking
const createRazorpayOrder = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id: eventId } = req.params;
    const { userId, quantity, seatType = 'Normal', customerDetails, countryCode = 'IN' } = req.body;
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
    // Calculate amounts (no booking fee or GST)
    const totalAmount = unitPrice * quantity;
    const bookingFee = 0;
    const taxAmount = 0;
    const finalAmount = totalAmount;
    const bookingReference = generateBookingReference();
    // Get currency based on country code
    const currency = razorpayService_1.default.getCurrencyForCountry(countryCode);
    try {
        // Check if vendor has Razorpay Route linked account for split payment
        const vendorId = (_a = event.vendorId) === null || _a === void 0 ? void 0 : _a.toString();
        let linkedAccountId = null;
        if (vendorId) {
            linkedAccountId = yield wallet_controller_1.WalletController.getVendorLinkedAccountId(vendorId);
        }
        const orderNotes = {
            eventId: eventId,
            userId: userId,
            quantity: quantity.toString(),
            seatType: seatType,
            customerName: customerDetails.name,
            customerEmail: customerDetails.email,
        };
        let razorpayOrder;
        if (linkedAccountId && currency === 'INR') {
            // Route payment: Create order with transfer to vendor's linked account
            const platformFeePercentage = yield wallet_controller_1.WalletController.getPlatformFeePercentage('events', event.isGovernmentEvent || false);
            const amountInPaise = Math.round(finalAmount * 100);
            const platformFeeInPaise = Math.round((amountInPaise * platformFeePercentage) / 100);
            const vendorAmountInPaise = amountInPaise - platformFeeInPaise;
            const holdTimestamp = razorpayRouteService_1.default.getSettlementHoldTimestamp();
            const holdDays = razorpayRouteService_1.default.getSettlementHoldDays();
            razorpayOrder = yield razorpayService_1.default.createOrderWithTransfers({
                amount: finalAmount,
                currency: 'INR',
                receipt: bookingReference,
                notes: orderNotes,
            }, [{
                    account: linkedAccountId,
                    amount: vendorAmountInPaise,
                    currency: 'INR',
                    notes: {
                        eventId: eventId,
                        vendorId: vendorId,
                        platformFee: platformFeePercentage.toString(),
                    },
                    linked_account_notes: ['eventId', 'vendorId'],
                    on_hold: holdDays > 0,
                    on_hold_until: holdDays > 0 ? holdTimestamp : undefined,
                }]);
        }
        else {
            // Normal order (no Route transfer)
            razorpayOrder = yield razorpayService_1.default.createOrder({
                amount: finalAmount,
                currency: currency,
                receipt: bookingReference,
                notes: orderNotes,
            });
        }
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
            bookingStatus: 'pending',
            paymentMethod: 'razorpay',
            cashfreeOrderId: razorpayOrder.id,
            transactionId: razorpayOrder.id,
            bookedAt: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            customerDetails,
        };
        const newBooking = yield event_booking_model_1.EventBooking.create(bookingData);
        // Record initial transaction
        yield event_booking_model_1.EventPaymentTransaction.create({
            bookingId: newBooking._id,
            paymentGateway: 'razorpay',
            gatewayTransactionId: razorpayOrder.id,
            amount: finalAmount,
            currency: currency,
            status: 'pending',
            paymentMethod: 'razorpay',
            gatewayResponse: razorpayOrder,
        });
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.CREATED,
            success: true,
            message: 'Razorpay payment order created successfully',
            data: {
                booking: newBooking,
                paymentGateway: 'razorpay',
                razorpayOrder: {
                    orderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    keyId: razorpayService_1.default.getRazorpayKeyId(),
                },
                event: {
                    id: event._id,
                    title: event.title,
                }
            },
        });
    }
    catch (error) {
        console.error('Razorpay order creation error:', error);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to create payment order',
            data: error.message || null,
        });
    }
}));
// Verify Razorpay payment
const verifyRazorpayPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { orderId, paymentId, signature } = req.body;
    // Verify signature
    const isValid = razorpayService_1.default.verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Invalid payment signature',
            data: null,
        });
    }
    try {
        // Fetch payment details from Razorpay
        const payment = yield razorpayService_1.default.fetchPayment(paymentId);
        // Find booking by order ID
        const booking = yield event_booking_model_1.EventBooking.findOne({
            $or: [
                { cashfreeOrderId: orderId },
                { transactionId: orderId }
            ]
        });
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
            status: payment.status === 'captured' ? 'completed' : payment.status,
            gatewayResponse: payment,
            processedAt: new Date(),
        });
        if (payment.status === 'captured') {
            // Update booking to completed
            booking.paymentStatus = 'completed';
            booking.bookingStatus = 'confirmed';
            yield booking.save();
            // Update event seat availability
            const event = yield events_model_1.default.findById(booking.eventId);
            if (event) {
                if (event.seatTypes && event.seatTypes.length > 0) {
                    const seatType = event.seatTypes.find((st) => st.name.toLowerCase() === booking.seatType.toLowerCase());
                    if (seatType) {
                        seatType.availableSeats = Math.max(0, seatType.availableSeats - booking.quantity);
                    }
                }
                event.availableSeats = Math.max(0, event.availableSeats - booking.quantity);
                event.totalTicketsSold = (event.totalTicketsSold || 0) + booking.quantity;
                yield event.save();
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
                const qrCodeUrl = yield qrcode_1.default.toDataURL(qrData);
                const eTicket = yield event_booking_model_1.EventETicket.create({
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
            const eventData = event;
            if (eventData && eventData.vendorId) {
                try {
                    // Check if this was a Route transfer order
                    let razorpayTransferId = '';
                    if (payment.order_id) {
                        try {
                            const orderDetails = yield razorpayService_1.default.fetchOrder(payment.order_id);
                            if (orderDetails.transfers && orderDetails.transfers.length > 0) {
                                razorpayTransferId = orderDetails.transfers[0].id || '';
                            }
                        }
                        catch (e) { /* ignore fetch error */ }
                    }
                    yield wallet_controller_1.WalletController.creditVendorEarnings({
                        vendorId: eventData.vendorId.toString(),
                        amount: booking.finalAmount,
                        serviceType: 'events',
                        referenceType: 'event_booking',
                        referenceId: booking._id.toString(),
                        isGovernmentEvent: eventData.isGovernmentEvent || false,
                        razorpayTransferId,
                        razorpayPaymentId: paymentId,
                        metadata: {
                            bookingId: booking._id.toString(),
                            customerName: (_a = booking.customerDetails) === null || _a === void 0 ? void 0 : _a.name,
                            customerEmail: (_b = booking.customerDetails) === null || _b === void 0 ? void 0 : _b.email,
                            itemTitle: (event === null || event === void 0 ? void 0 : event.title) || '',
                        },
                    });
                }
                catch (walletError) {
                    console.error('Failed to credit vendor wallet:', walletError);
                }
            }
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
                    eTickets,
                    paymentStatus: 'completed',
                },
            });
        }
        else {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: 'Payment is being processed',
                data: {
                    paymentStatus: payment.status,
                },
            });
        }
    }
    catch (error) {
        console.error('Payment verification error:', error);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to verify payment',
            data: null,
        });
    }
}));
// Razorpay Webhook handler
const handleRazorpayWebhook = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = JSON.stringify(req.body);
    // Verify webhook signature
    const isValid = razorpayService_1.default.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ message: 'Invalid signature' });
    }
    const { event, payload } = req.body;
    if (event === 'payment.captured') {
        const payment = payload.payment.entity;
        const orderId = payment.order_id;
        // Find and update booking
        const booking = yield event_booking_model_1.EventBooking.findOne({
            $or: [
                { cashfreeOrderId: orderId },
                { transactionId: orderId }
            ]
        });
        if (booking && booking.paymentStatus !== 'completed') {
            booking.paymentStatus = 'completed';
            booking.bookingStatus = 'confirmed';
            yield booking.save();
            // Update event availability
            const eventDoc = yield events_model_1.default.findById(booking.eventId);
            if (eventDoc) {
                if (eventDoc.seatTypes && eventDoc.seatTypes.length > 0) {
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
                    const qrCodeImageUrl = yield qrcode_1.default.toDataURL(qrData);
                    yield event_booking_model_1.EventETicket.create({
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
            yield event_booking_model_1.EventPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
                status: 'completed',
                gatewayResponse: payment,
                processedAt: new Date(),
            });
        }
    }
    else if (event === 'payment.failed') {
        const payment = payload.payment.entity;
        const orderId = payment.order_id;
        yield event_booking_model_1.EventBooking.findOneAndUpdate({
            $or: [
                { cashfreeOrderId: orderId },
                { transactionId: orderId }
            ]
        }, { paymentStatus: 'failed', bookingStatus: 'cancelled' });
        yield event_booking_model_1.EventPaymentTransaction.findOneAndUpdate({ gatewayTransactionId: orderId }, {
            status: 'failed',
            gatewayResponse: payment,
            processedAt: new Date(),
        });
    }
    return res.status(200).json({ received: true });
}));
// Get payment status
const getPaymentStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const booking = yield event_booking_model_1.EventBooking.findOne({
        $or: [
            { cashfreeOrderId: orderId },
            { transactionId: orderId }
        ]
    })
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
        // Get the payment ID from transaction
        const transaction = yield event_booking_model_1.EventPaymentTransaction.findOne({
            bookingId: booking._id,
            status: 'completed'
        });
        if (!transaction || !transaction.gatewayResponse) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Payment transaction not found',
                data: null,
            });
        }
        // Get payment ID from gateway response
        const paymentId = transaction.gatewayResponse.id;
        const refund = yield razorpayService_1.default.refundPayment(paymentId, booking.finalAmount, { reason: reason || 'Customer requested refund' });
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
            data: refund,
        });
    }
    catch (error) {
        console.error('Refund error:', error);
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Failed to initiate refund',
            data: error.message || null,
        });
    }
}));
exports.RazorpayPaymentController = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    handleRazorpayWebhook,
    getPaymentStatus,
    initiateRefund,
};
