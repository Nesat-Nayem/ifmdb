"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRouter = void 0;
const express_1 = __importDefault(require("express"));
const events_controller_1 = require("./events.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const events_validation_1 = require("./events.validation");
const event_booking_controller_1 = require("./event-booking.controller");
const event_booking_validation_1 = require("./event-booking.validation");
const razorpay_payment_controller_1 = require("./razorpay-payment.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const TicketScannerController = __importStar(require("./ticket-scanner.controller"));
const TicketScannerValidation = __importStar(require("./ticket-scanner.validation"));
const ticket_scanner_middleware_1 = require("./ticket-scanner.middleware");
const router = express_1.default.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       required:
 *         - venueName
 *         - address
 *         - city
 *       properties:
 *         venueName:
 *           type: string
 *           description: Name of the venue
 *         address:
 *           type: string
 *           description: Full address of the venue
 *         city:
 *           type: string
 *           description: City where the event is held
 *         state:
 *           type: string
 *           description: State/Province
 *         postalCode:
 *           type: string
 *           description: Postal/ZIP code
 *         latitude:
 *           type: number
 *           description: Latitude coordinate
 *         longitude:
 *           type: number
 *           description: Longitude coordinate
 *
 *     EventPerformer:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the performer
 *         type:
 *           type: string
 *           enum: [artist, comedian, band, speaker, other]
 *           description: Type of performer
 *         image:
 *           type: string
 *           description: URL to performer's image
 *         bio:
 *           type: string
 *           description: Biography of the performer
 *
 *     EventOrganizer:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the organizer
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email
 *         phone:
 *           type: string
 *           description: Contact phone number
 *         logo:
 *           type: string
 *           description: URL to organizer's logo
 *
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - eventType
 *         - category
 *         - startDate
 *         - startTime
 *         - endTime
 *         - location
 *         - ticketPrice
 *         - totalSeats
 *         - availableSeats
 *         - posterImage
 *       properties:
 *         _id:
 *           type: string
 *           description: Event ID
 *         title:
 *           type: string
 *           description: Event title
 *         description:
 *           type: string
 *           description: Event description
 *         eventType:
 *           type: string
 *           enum: [comedy, music, concert, theater, sports, conference, workshop, other]
 *           description: Type of event
 *         category:
 *           type: string
 *           description: Event category
 *         startDate:
 *           type: string
 *           format: date
 *           description: Event start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Event end date
 *         startTime:
 *           type: string
 *           description: Event start time
 *         endTime:
 *           type: string
 *           description: Event end time
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         ticketPrice:
 *           type: number
 *           minimum: 0
 *           description: Ticket price
 *         totalSeats:
 *           type: integer
 *           minimum: 1
 *           description: Total number of seats
 *         availableSeats:
 *           type: integer
 *           minimum: 0
 *           description: Available seats
 *         posterImage:
 *           type: string
 *           description: URL to poster image
 *         galleryImages:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of gallery image URLs
 *         performers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventPerformer'
 *         organizers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventOrganizer'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Event tags
 *         status:
 *           type: string
 *           enum: [upcoming, ongoing, completed, cancelled]
 *           description: Event status
 *         isActive:
 *           type: boolean
 *           description: Whether the event is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     EventBooking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Event booking ID
 *         eventId:
 *           type: string
 *           description: Event ID reference
 *         userId:
 *           type: string
 *           description: User ID reference
 *         bookingReference:
 *           type: string
 *           description: Unique booking reference
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Number of tickets
 *         unitPrice:
 *           type: number
 *           description: Ticket unit price at time of booking
 *         totalAmount:
 *           type: number
 *         bookingFee:
 *           type: number
 *         taxAmount:
 *           type: number
 *         discountAmount:
 *           type: number
 *         finalAmount:
 *           type: number
 *         paymentStatus:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         bookingStatus:
 *           type: string
 *           enum: [confirmed, cancelled, expired]
 *         paymentMethod:
 *           type: string
 *           enum: [card, wallet, upi, netbanking, cash]
 *         transactionId:
 *           type: string
 *         customerDetails:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             phone:
 *               type: string
 *         bookedAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *
 *     EventBookingCreateRequest:
 *       type: object
 *       required:
 *         - userId
 *         - quantity
 *         - customerDetails
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID of the person making the booking
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Number of tickets to book
 *         seatType:
 *           type: string
 *           default: Normal
 *           description: Type of seat (e.g., Normal, VIP, Premium, VVIP). Must match one of the event's seat types
 *         bookingFee:
 *           type: number
 *           default: 0
 *           description: Additional booking fee
 *         taxAmount:
 *           type: number
 *           default: 0
 *           description: Tax amount
 *         discountAmount:
 *           type: number
 *           default: 0
 *           description: Discount amount to subtract
 *         paymentMethod:
 *           type: string
 *           enum: [card, wallet, upi, netbanking, cash]
 *           default: card
 *           description: Payment method to use
 *         customerDetails:
 *           type: object
 *           required: [name, email, phone]
 *           description: Customer contact details
 *           properties:
 *             name:
 *               type: string
 *               description: Customer name
 *             email:
 *               type: string
 *               format: email
 *               description: Customer email
 *             phone:
 *               type: string
 *               description: Customer phone number
 *
 *     EventPaymentRequest:
 *       type: object
 *       required:
 *         - paymentGateway
 *         - paymentMethod
 *         - amount
 *         - gatewayTransactionId
 *       properties:
 *         paymentGateway:
 *           type: string
 *           enum: [stripe, razorpay, paypal, paytm]
 *         paymentMethod:
 *           type: string
 *         amount:
 *           type: number
 *           minimum: 0
 *         currency:
 *           type: string
 *           default: USD
 *         gatewayTransactionId:
 *           type: string
 *         gatewayResponse:
 *           type: object
 *
 *     EventETicket:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: E-ticket ID
 *         bookingId:
 *           type: string
 *           description: Associated event booking ID
 *         ticketNumber:
 *           type: string
 *           description: Unique ticket number (e.g., ETK123ABC)
 *         ticketScannerId:
 *           type: string
 *           description: Unique scanner ID for QR code validation (e.g., SCAN123ABC456XY)
 *         qrCodeData:
 *           type: string
 *           description: JSON data encoded in the QR code
 *         qrCodeImageUrl:
 *           type: string
 *           description: Base64 encoded QR code image
 *         quantity:
 *           type: integer
 *           description: Number of tickets
 *         isUsed:
 *           type: boolean
 *           description: Whether the ticket has been scanned/used
 *         usedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was scanned
 *         scannedBy:
 *           type: string
 *           description: User ID of who scanned the ticket
 *         scanLocation:
 *           type: string
 *           description: Location where ticket was scanned
 *         generatedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was generated
 */
/**
 * @swagger
 * /v1/api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request
 */
router.post('/', (0, authMiddleware_1.auth)(), (0, validateRequest_1.default)(events_validation_1.EventValidation.createEventValidation), events_controller_1.EventController.createEvent);
/**
 * @swagger
 * /v1/api/events:
 *   get:
 *     summary: Get all events with filtering and pagination
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of events per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, and tags
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [comedy, music, concert, theater, sports, conference, workshop, other]
 *         description: Filter by event type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events until this date
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum ticket price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum ticket price
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, startDate, ticketPrice, createdAt]
 *           default: startDate
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', (0, authMiddleware_1.optionalAuth)(), (0, validateRequest_1.default)(events_validation_1.EventValidation.getEventsValidation), events_controller_1.EventController.getAllEvents);
/**
 * @swagger
 * /v1/api/events/upcoming:
 *   get:
 *     summary: Get upcoming events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Upcoming events retrieved successfully
 */
router.get('/upcoming', events_controller_1.EventController.getUpcomingEvents);
/**
 * @swagger
 * /v1/api/events/type/{type}:
 *   get:
 *     summary: Get events by type
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [comedy, music, concert, theater, sports, conference, workshop, other]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Events by type retrieved successfully
 */
router.get('/type/:type', events_controller_1.EventController.getEventsByType);
/**
 * @swagger
 * /v1/api/events/location/{city}:
 *   get:
 *     summary: Get events by city
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Events by location retrieved successfully
 */
router.get('/location/:city', events_controller_1.EventController.getEventsByLocation);
/**
 * @swagger
 * /v1/api/events/best-this-week:
 *   get:
 *     summary: Get best events this week (sorted by ticket sales)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Best events this week retrieved successfully
 */
router.get('/best-this-week', events_controller_1.EventController.getBestEventsThisWeek);
/**
 * @swagger
 * /v1/api/events/category/{categoryId}:
 *   get:
 *     summary: Get events by category ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Events by category retrieved successfully
 */
router.get('/category/:categoryId', events_controller_1.EventController.getEventsByCategory);
/**
 * @swagger
 * /v1/api/events/language/{eventLanguage}:
 *   get:
 *     summary: Get events by language
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventLanguage
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Events by language retrieved successfully
 */
router.get('/language/:eventLanguage', events_controller_1.EventController.getEventsByLanguage);
/**
 * @swagger
 * /v1/api/events/bookings:
 *   get:
 *     summary: Get all event bookings (filtering and pagination)
 *     tags: [Events - Ticketing]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *       - in: query
 *         name: bookingStatus
 *         schema:
 *           type: string
 *           enum: [confirmed, cancelled, expired]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [bookedAt, finalAmount, createdAt]
 *           default: bookedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Event bookings retrieved successfully
 */
router.get('/bookings', 
// auth(),
(0, validateRequest_1.default)(event_booking_validation_1.EventBookingValidation.getEventBookingsValidation), event_booking_controller_1.EventBookingController.getAllEventBookings);
/**
 * @swagger
 * /v1/api/events/{id}:
 *   put:
 *     summary: Update event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       404:
 *         description: Event not found
 */
router.put('/:id', (0, validateRequest_1.default)(events_validation_1.EventValidation.updateEventValidation), events_controller_1.EventController.updateEvent);
/**
 * @swagger
 * /v1/api/events/{id}:
 *   delete:
 *     summary: Delete event (soft delete)
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 */
router.delete('/:id', events_controller_1.EventController.deleteEvent);
/**
 * @swagger
 * /v1/api/events/{id}/book:
 *   post:
 *     summary: Create an event ticket booking (no seat selection)
 *     tags: [Events - Ticketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventBookingCreateRequest'
 *     responses:
 *       201:
 *         description: Event booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/EventBooking'
 *       400:
 *         description: Not enough available tickets
 *       404:
 *         description: Event not available for booking
 */
router.post('/:id/book', (0, validateRequest_1.default)(event_booking_validation_1.EventBookingValidation.createEventBookingValidation), event_booking_controller_1.EventBookingController.createEventBooking);
/**
 * @swagger
 * /v1/api/events/bookings:
 *   get:
 *     summary: Get all event bookings (filtering and pagination)
 *     tags: [Events - Ticketing]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *       - in: query
 *         name: bookingStatus
 *         schema:
 *           type: string
 *           enum: [confirmed, cancelled, expired]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [bookedAt, finalAmount, createdAt]
 *           default: bookedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Event bookings retrieved successfully
 */
router.get('/bookings', (0, authMiddleware_1.auth)('admin', 'vendor'), (0, validateRequest_1.default)(event_booking_validation_1.EventBookingValidation.getEventBookingsValidation), event_booking_controller_1.EventBookingController.getAllEventBookings);
/**
 * @swagger
 * /v1/api/events/bookings/{id}:
 *   get:
 *     summary: Get event booking by ID
 *     tags: [Events - Ticketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event booking ID
 *     responses:
 *       200:
 *         description: Event booking retrieved successfully
 *       404:
 *         description: Event booking not found
 */
router.get('/bookings/:id', event_booking_controller_1.EventBookingController.getEventBookingById);
/**
 * @swagger
 * /v1/api/events/bookings/{id}/payment:
 *   post:
 *     summary: Process payment for an event booking
 *     tags: [Events - Ticketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventPaymentRequest'
 *     responses:
 *       200:
 *         description: Payment processed and e-ticket generated
 *       400:
 *         description: Payment already completed
 *       404:
 *         description: Event booking not found
 */
router.post('/bookings/:id/payment', (0, validateRequest_1.default)(event_booking_validation_1.EventBookingValidation.processEventPaymentValidation), event_booking_controller_1.EventBookingController.processEventPayment);
/**
 * @swagger
 * /v1/api/events/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel an event booking
 *     tags: [Events - Ticketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event booking ID
 *     responses:
 *       200:
 *         description: Event booking cancelled successfully
 *       400:
 *         description: Booking already cancelled
 *       404:
 *         description: Event booking not found
 */
router.put('/bookings/:id/cancel', event_booking_controller_1.EventBookingController.cancelEventBooking);
/**
 * @swagger
 * /v1/api/events/bookings/{id}/ticket:
 *   get:
 *     summary: Get e-ticket for an event booking
 *     tags: [Events - Ticketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event booking ID
 *     responses:
 *       200:
 *         description: E-ticket retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/EventETicket'
 *       404:
 *         description: E-ticket not found
 */
router.get('/bookings/:id/ticket', event_booking_controller_1.EventBookingController.getEventETicket);
/**
 * @swagger
 * /v1/api/events/bookings/{id}:
 *   delete:
 *     summary: Delete an event booking
 *     tags: [Events - Ticketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event booking ID
 *     responses:
 *       200:
 *         description: Event booking deleted successfully
 *       404:
 *         description: Event booking not found
 */
router.delete('/bookings/:id', event_booking_controller_1.EventBookingController.deleteEventBooking);
/**
 * @swagger
 * /v1/api/events/tickets/validate/{scannerId}:
 *   post:
 *     summary: Validate and scan ticket by scanner ID (marks ticket as used)
 *     tags: [Events - Ticket Scanner]
 *     parameters:
 *       - in: path
 *         name: scannerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket Scanner ID (from QR code)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scannedBy:
 *                 type: string
 *                 description: User ID of the scanner operator
 *               scanLocation:
 *                 type: string
 *                 description: Location where ticket was scanned (e.g., Gate A, Main Entrance)
 *     responses:
 *       200:
 *         description: Ticket validated successfully - Entry allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketScannerId:
 *                       type: string
 *                     ticketNumber:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     isUsed:
 *                       type: boolean
 *                     usedAt:
 *                       type: string
 *                       format: date-time
 *                     booking:
 *                       type: object
 *       400:
 *         description: Ticket already used or booking cancelled
 *       404:
 *         description: Invalid ticket - Ticket not found
 */
router.post('/tickets/validate/:scannerId', event_booking_controller_1.EventBookingController.validateTicketByScannerId);
/**
 * @swagger
 * /v1/api/events/tickets/status/{scannerId}:
 *   get:
 *     summary: Check ticket status by scanner ID (without marking as used)
 *     tags: [Events - Ticket Scanner]
 *     parameters:
 *       - in: path
 *         name: scannerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket Scanner ID (from QR code)
 *     responses:
 *       200:
 *         description: Ticket status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketScannerId:
 *                       type: string
 *                     ticketNumber:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     isUsed:
 *                       type: boolean
 *                     usedAt:
 *                       type: string
 *                       format: date-time
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     booking:
 *                       type: object
 *       404:
 *         description: Ticket not found
 */
router.get('/tickets/status/:scannerId', event_booking_controller_1.EventBookingController.checkTicketStatus);
// =============================================
// RAZORPAY PAYMENT ROUTES
// =============================================
/**
 * @swagger
 * /v1/api/events/{id}/payment/create-order:
 *   post:
 *     summary: Create Razorpay payment order
 *     tags: [Events - Razorpay Payment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - quantity
 *               - customerDetails
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               quantity:
 *                 type: number
 *                 description: Number of tickets
 *               seatType:
 *                 type: string
 *                 description: Seat type (Normal, VIP, VVIP)
 *                 default: Normal
 *               customerDetails:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                   - phone
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *               returnUrl:
 *                 type: string
 *                 description: URL to redirect after payment
 *     responses:
 *       201:
 *         description: Payment order created successfully
 *       400:
 *         description: Invalid request or insufficient seats
 *       404:
 *         description: Event not found
 */
router.post('/:id/payment/create-order', razorpay_payment_controller_1.RazorpayPaymentController.createRazorpayOrder);
/**
 * @swagger
 * /v1/api/events/payment/verify:
 *   post:
 *     summary: Verify Razorpay payment
 *     tags: [Events - Razorpay Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cashfree Order ID
 *     responses:
 *       200:
 *         description: Payment verification result
 *       404:
 *         description: Booking not found
 */
router.post('/payment/verify', razorpay_payment_controller_1.RazorpayPaymentController.verifyRazorpayPayment);
/**
 * @swagger
 * /v1/api/events/payment/status/{orderId}:
 *   get:
 *     summary: Get payment status by order ID
 *     tags: [Events - Razorpay Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cashfree Order ID
 *     responses:
 *       200:
 *         description: Payment status retrieved
 *       404:
 *         description: Booking not found
 */
router.get('/payment/status/:orderId', razorpay_payment_controller_1.RazorpayPaymentController.getPaymentStatus);
/**
 * @swagger
 * /v1/api/events/payment/webhook:
 *   post:
 *     summary: Razorpay webhook handler
 *     tags: [Events - Razorpay Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/payment/webhook', razorpay_payment_controller_1.RazorpayPaymentController.handleRazorpayWebhook);
/**
 * @swagger
 * /v1/api/events/payment/refund/{bookingId}:
 *   post:
 *     summary: Initiate refund for a booking
 *     tags: [Events - Razorpay Payment]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Refund reason
 *     responses:
 *       200:
 *         description: Refund initiated successfully
 *       400:
 *         description: Cannot refund
 *       404:
 *         description: Booking not found
 */
router.post('/payment/refund/:bookingId', razorpay_payment_controller_1.RazorpayPaymentController.initiateRefund);
// ============ TICKET SCANNER ROUTES ============
/**
 * @swagger
 * /v1/api/events/scanner/login:
 *   post:
 *     summary: Scanner login (for Flutter app)
 *     tags: [Events - Ticket Scanner]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               deviceInfo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/scanner/login', (0, validateRequest_1.default)(TicketScannerValidation.scannerLoginSchema), TicketScannerController.scannerLogin);
/**
 * @swagger
 * /v1/api/events/scanner/logout:
 *   post:
 *     summary: Scanner logout
 *     tags: [Events - Ticket Scanner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/scanner/logout', ticket_scanner_middleware_1.authenticateScanner, TicketScannerController.scannerLogout);
/**
 * @swagger
 * /v1/api/events/scanner/validate:
 *   post:
 *     summary: Validate a ticket by barcode/QR code
 *     tags: [Events - Ticket Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingReference
 *             properties:
 *               bookingReference:
 *                 type: string
 *                 description: The barcode/QR code value (booking reference)
 *               deviceInfo:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *     responses:
 *       200:
 *         description: Ticket validated successfully
 *       400:
 *         description: Invalid or already used ticket
 *       403:
 *         description: Not authorized for this event
 *       404:
 *         description: Ticket not found
 */
router.post('/scanner/validate', ticket_scanner_middleware_1.authenticateScanner, (0, validateRequest_1.default)(TicketScannerValidation.validateTicketSchema), TicketScannerController.validateTicket);
/**
 * @swagger
 * /v1/api/events/scanner/history:
 *   get:
 *     summary: Get scan history for scanner
 *     tags: [Events - Ticket Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *       - in: query
 *         name: scanResult
 *         schema:
 *           type: string
 *           enum: [valid, invalid, already_used, expired, wrong_event, not_found]
 *     responses:
 *       200:
 *         description: Scan history retrieved
 */
router.get('/scanner/history', ticket_scanner_middleware_1.authenticateScanner, TicketScannerController.getScanHistory);
/**
 * @swagger
 * /v1/api/events/scanner/stats:
 *   get:
 *     summary: Get scan statistics
 *     tags: [Events - Ticket Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */
router.get('/scanner/stats', ticket_scanner_middleware_1.authenticateScanner, TicketScannerController.getScanStats);
// ============ VENDOR SCANNER MANAGEMENT ROUTES ============
/**
 * @swagger
 * /v1/api/events/scanner-access:
 *   post:
 *     summary: Create a new scanner access account (Vendor only)
 *     tags: [Events - Scanner Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               allowedEvents:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Scanner access created
 *       400:
 *         description: Validation error
 */
router.post('/scanner-access', (0, authMiddleware_1.auth)('vendor', 'admin'), (0, validateRequest_1.default)(TicketScannerValidation.createScannerAccessSchema), TicketScannerController.createScannerAccess);
/**
 * @swagger
 * /v1/api/events/scanner-access:
 *   get:
 *     summary: Get all scanner access accounts for vendor
 *     tags: [Events - Scanner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scanner accounts retrieved
 */
/**
 * @swagger
 * /v1/api/events/scanner-access/logs:
 *   get:
 *     summary: Get all scan logs for vendor's scanners
 *     tags: [Events - Scanner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: scannerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *       - in: query
 *         name: scanResult
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scan logs retrieved
 */
router.get('/scanner-access/logs', (0, authMiddleware_1.auth)('vendor', 'admin'), TicketScannerController.getVendorScanLogs);
router.get('/scanner-access', (0, authMiddleware_1.auth)('vendor', 'admin'), TicketScannerController.getVendorScannerAccounts);
/**
 * @swagger
 * /v1/api/events/scanner-access/{id}/toggle:
 *   patch:
 *     summary: Toggle scanner access status (activate/deactivate)
 *     tags: [Events - Scanner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status toggled
 *       404:
 *         description: Not found
 */
router.patch('/scanner-access/:id/toggle', (0, authMiddleware_1.auth)('vendor', 'admin'), TicketScannerController.toggleScannerStatus);
/**
 * @swagger
 * /v1/api/events/scanner-access/{id}:
 *   get:
 *     summary: Get scanner access by ID
 *     tags: [Events - Scanner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scanner access retrieved
 *       404:
 *         description: Not found
 */
router.get('/scanner-access/:id', (0, authMiddleware_1.auth)('vendor', 'admin'), TicketScannerController.getScannerAccessById);
/**
 * @swagger
 * /v1/api/events/scanner-access/{id}:
 *   put:
 *     summary: Update scanner access
 *     tags: [Events - Scanner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               allowedEvents:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Scanner access updated
 *       404:
 *         description: Not found
 */
router.put('/scanner-access/:id', (0, authMiddleware_1.auth)('vendor', 'admin'), (0, validateRequest_1.default)(TicketScannerValidation.updateScannerAccessSchema), TicketScannerController.updateScannerAccess);
/**
 * @swagger
 * /v1/api/events/scanner-access/{id}:
 *   delete:
 *     summary: Delete scanner access
 *     tags: [Events - Scanner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scanner access deleted
 *       404:
 *         description: Not found
 */
router.delete('/scanner-access/:id', (0, authMiddleware_1.auth)('vendor', 'admin'), TicketScannerController.deleteScannerAccess);
// ============ GENERIC EVENT ROUTES (MUST BE LAST) ============
// These catch-all routes must be defined AFTER all specific routes to avoid conflicts
/**
 * @swagger
 * /v1/api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
router.get('/:id', events_controller_1.EventController.getEventById);
exports.eventRouter = router;
