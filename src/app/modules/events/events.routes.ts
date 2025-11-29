import express from 'express';
import { EventController } from './events.controller';
import validateRequest from '../../middlewares/validateRequest';
import { EventValidation } from './events.validation';
import { EventBookingController } from './event-booking.controller';
import { EventBookingValidation } from './event-booking.validation';

const router = express.Router();

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
 *         quantity:
 *           type: integer
 *           minimum: 1
 *         bookingFee:
 *           type: number
 *         taxAmount:
 *           type: number
 *         discountAmount:
 *           type: number
 *         paymentMethod:
 *           type: string
 *           enum: [card, wallet, upi, netbanking, cash]
 *         customerDetails:
 *           type: object
 *           required: [name, email, phone]
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             phone:
 *               type: string
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
 *         qrCodeData:
 *           type: string
 *         qrCodeImageUrl:
 *           type: string
 *         quantity:
 *           type: integer
 *         isUsed:
 *           type: boolean
 *         usedAt:
 *           type: string
 *           format: date-time
 *         generatedAt:
 *           type: string
 *           format: date-time
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
router.post(
  '/',
  validateRequest(EventValidation.createEventValidation),
  EventController.createEvent
);

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
router.get(
  '/',
  validateRequest(EventValidation.getEventsValidation),
  EventController.getAllEvents
);

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
router.get('/upcoming', EventController.getUpcomingEvents);

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
router.get('/type/:type', EventController.getEventsByType);

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
router.get('/location/:city', EventController.getEventsByLocation);

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
router.get('/best-this-week', EventController.getBestEventsThisWeek);

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
router.get('/category/:categoryId', EventController.getEventsByCategory);

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
router.get('/language/:eventLanguage', EventController.getEventsByLanguage);

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
router.get(
  '/bookings',
  validateRequest(EventBookingValidation.getEventBookingsValidation),
  EventBookingController.getAllEventBookings
);

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
router.get('/:id', EventController.getEventById);

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
router.put(
  '/:id',
  validateRequest(EventValidation.updateEventValidation),
  EventController.updateEvent
);

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
router.delete('/:id', EventController.deleteEvent);

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
router.post(
  '/:id/book',
  validateRequest(EventBookingValidation.createEventBookingValidation),
  EventBookingController.createEventBooking
);

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
router.get(
  '/bookings',
  validateRequest(EventBookingValidation.getEventBookingsValidation),
  EventBookingController.getAllEventBookings
);

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
router.get('/bookings/:id', EventBookingController.getEventBookingById);

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
router.post(
  '/bookings/:id/payment',
  validateRequest(EventBookingValidation.processEventPaymentValidation),
  EventBookingController.processEventPayment
);

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
router.put('/bookings/:id/cancel', EventBookingController.cancelEventBooking);

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
router.get('/bookings/:id/ticket', EventBookingController.getEventETicket);

export const eventRouter = router;
