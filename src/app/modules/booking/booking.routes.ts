import express from 'express';
import { BookingController } from './booking.controller';
import validateRequest from '../../middlewares/validateRequest';
import { BookingValidation } from './booking.validation';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Cinema:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - city
 *       properties:
 *         _id:
 *           type: string
 *           description: Cinema ID
 *         name:
 *           type: string
 *           description: Cinema name
 *         address:
 *           type: string
 *           description: Cinema address
 *         city:
 *           type: string
 *           description: City where cinema is located
 *         state:
 *           type: string
 *           description: State/Province
 *         postalCode:
 *           type: string
 *           description: Postal code
 *         phone:
 *           type: string
 *           description: Contact phone
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email
 *         latitude:
 *           type: number
 *           description: Latitude coordinate
 *         longitude:
 *           type: number
 *           description: Longitude coordinate
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *           description: Available facilities
 *         isActive:
 *           type: boolean
 *           description: Whether cinema is active
 * 
 *     Showtime:
 *       type: object
 *       required:
 *         - movieId
 *         - hallId
 *         - showDate
 *         - showTime
 *         - endTime
 *         - basePrice
 *         - language
 *         - availableSeats
 *       properties:
 *         _id:
 *           type: string
 *           description: Showtime ID
 *         movieId:
 *           type: string
 *           description: Movie ID reference
 *         hallId:
 *           type: string
 *           description: Cinema hall ID reference
 *         showDate:
 *           type: string
 *           format: date
 *           description: Show date
 *         showTime:
 *           type: string
 *           description: Show time (e.g., "10:30 AM")
 *         endTime:
 *           type: string
 *           description: End time
 *         basePrice:
 *           type: number
 *           minimum: 0
 *           description: Base ticket price
 *         formatType:
 *           type: string
 *           enum: [2D, 3D, IMAX, 4DX, Dolby Cinema]
 *           description: Movie format
 *         language:
 *           type: string
 *           description: Movie language
 *         availableSeats:
 *           type: integer
 *           minimum: 0
 *           description: Available seats count
 *         bookedSeats:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of booked seat IDs
 *         status:
 *           type: string
 *           enum: [active, cancelled, housefull]
 *           description: Showtime status
 *         isActive:
 *           type: boolean
 *           description: Whether showtime is active
 * 
 *     SelectedSeat:
 *       type: object
 *       required:
 *         - seatId
 *         - rowLabel
 *         - seatNumber
 *         - seatType
 *         - seatPrice
 *       properties:
 *         seatId:
 *           type: string
 *           description: Seat ID
 *         rowLabel:
 *           type: string
 *           description: Row label (A, B, C, etc.)
 *         seatNumber:
 *           type: integer
 *           description: Seat number
 *         seatType:
 *           type: string
 *           description: Type of seat
 *         seatPrice:
 *           type: number
 *           description: Price for this seat
 * 
 *     CustomerDetails:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *       properties:
 *         name:
 *           type: string
 *           description: Customer name
 *         email:
 *           type: string
 *           format: email
 *           description: Customer email
 *         phone:
 *           type: string
 *           description: Customer phone number
 * 
 *     Booking:
 *       type: object
 *       required:
 *         - showtimeId
 *         - userId
 *         - selectedSeats
 *         - totalAmount
 *         - finalAmount
 *         - customerDetails
 *       properties:
 *         _id:
 *           type: string
 *           description: Booking ID
 *         showtimeId:
 *           type: string
 *           description: Showtime ID reference
 *         userId:
 *           type: string
 *           description: User ID reference
 *         bookingReference:
 *           type: string
 *           description: Unique booking reference
 *         selectedSeats:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SelectedSeat'
 *         totalAmount:
 *           type: number
 *           minimum: 0
 *           description: Total amount before fees
 *         bookingFee:
 *           type: number
 *           minimum: 0
 *           description: Booking fee
 *         taxAmount:
 *           type: number
 *           minimum: 0
 *           description: Tax amount
 *         discountAmount:
 *           type: number
 *           minimum: 0
 *           description: Discount amount
 *         finalAmount:
 *           type: number
 *           minimum: 0
 *           description: Final amount to pay
 *         paymentStatus:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *           description: Payment status
 *         bookingStatus:
 *           type: string
 *           enum: [confirmed, cancelled, expired]
 *           description: Booking status
 *         paymentMethod:
 *           type: string
 *           enum: [card, wallet, upi, netbanking, cash]
 *           description: Payment method
 *         transactionId:
 *           type: string
 *           description: Payment transaction ID
 *         customerDetails:
 *           $ref: '#/components/schemas/CustomerDetails'
 *         bookedAt:
 *           type: string
 *           format: date-time
 *           description: Booking timestamp
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Booking expiry time
 * 
 *     PaymentRequest:
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
 *           description: Payment gateway used
 *         paymentMethod:
 *           type: string
 *           description: Payment method
 *         amount:
 *           type: number
 *           minimum: 0
 *           description: Payment amount
 *         currency:
 *           type: string
 *           default: USD
 *           description: Currency code
 *         gatewayTransactionId:
 *           type: string
 *           description: Gateway transaction ID
 *         gatewayResponse:
 *           type: object
 *           description: Gateway response data
 * 
 *     ETicket:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: E-ticket ID
 *         bookingId:
 *           type: string
 *           description: Associated booking ID
 *         ticketNumber:
 *           type: string
 *           description: Unique ticket number
 *         qrCodeData:
 *           type: string
 *           description: QR code data
 *         qrCodeImageUrl:
 *           type: string
 *           description: QR code image URL
 *         isUsed:
 *           type: boolean
 *           description: Whether ticket has been used
 *         usedAt:
 *           type: string
 *           format: date-time
 *           description: When ticket was used
 *         generatedAt:
 *           type: string
 *           format: date-time
 *           description: When ticket was generated
 */

// CINEMA ROUTES
/**
 * @swagger
 * /v1/api/booking/cinemas:
 *   post:
 *     summary: Create a new cinema
 *     tags: [Booking - Cinemas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cinema'
 *     responses:
 *       201:
 *         description: Cinema created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  '/cinemas',
  validateRequest(BookingValidation.createCinemaValidation),
  BookingController.createCinema
);

/**
 * @swagger
 * /v1/api/booking/cinemas:
 *   get:
 *     summary: Get all cinemas with filtering and pagination
 *     tags: [Booking - Cinemas]
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
 *         description: Number of cinemas per page
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, address, city
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, city, createdAt]
 *           default: name
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
 *         description: Cinemas retrieved successfully
 */
router.get(
  '/cinemas',
  validateRequest(BookingValidation.getCinemasValidation),
  BookingController.getAllCinemas
);

/**
 * @swagger
 * /v1/api/booking/cinemas/{id}:
 *   get:
 *     summary: Get cinema by ID
 *     tags: [Booking - Cinemas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cinema ID
 *     responses:
 *       200:
 *         description: Cinema retrieved successfully
 *       404:
 *         description: Cinema not found
 */
router.get('/cinemas/:id', BookingController.getCinemaById);

/**
 * @swagger
 * /v1/api/booking/cinemas/{id}:
 *   put:
 *     summary: Update cinema
 *     tags: [Booking - Cinemas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cinema ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cinema'
 *     responses:
 *       200:
 *         description: Cinema updated successfully
 *       404:
 *         description: Cinema not found
 */
router.put(
  '/cinemas/:id',
  validateRequest(BookingValidation.updateCinemaValidation),
  BookingController.updateCinema
);

/**
 * @swagger
 * /v1/api/booking/cinemas/{id}:
 *   delete:
 *     summary: Delete cinema (soft delete)
 *     tags: [Booking - Cinemas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cinema ID
 *     responses:
 *       200:
 *         description: Cinema deleted successfully
 *       404:
 *         description: Cinema not found
 */
router.delete('/cinemas/:id', BookingController.deleteCinema);

// SHOWTIME ROUTES
/**
 * @swagger
 * /v1/api/booking/showtimes:
 *   post:
 *     summary: Create a new showtime
 *     tags: [Booking - Showtimes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Showtime'
 *     responses:
 *       201:
 *         description: Showtime created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Cinema hall not found
 */
router.post(
  '/showtimes',
  validateRequest(BookingValidation.createShowtimeValidation),
  BookingController.createShowtime
);

/**
 * @swagger
 * /v1/api/booking/showtimes:
 *   get:
 *     summary: Get all showtimes with filtering and pagination
 *     tags: [Booking - Showtimes]
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
 *         description: Number of showtimes per page
 *       - in: query
 *         name: movieId
 *         schema:
 *           type: string
 *         description: Filter by movie ID
 *       - in: query
 *         name: cinemaId
 *         schema:
 *           type: string
 *         description: Filter by cinema ID
 *       - in: query
 *         name: hallId
 *         schema:
 *           type: string
 *         description: Filter by hall ID
 *       - in: query
 *         name: showDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by show date
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language
 *       - in: query
 *         name: formatType
 *         schema:
 *           type: string
 *           enum: [2D, 3D, IMAX, 4DX, Dolby Cinema]
 *         description: Filter by format type
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, cancelled, housefull]
 *         description: Filter by status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [showTime, basePrice, createdAt]
 *           default: showTime
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
 *         description: Showtimes retrieved successfully
 */
router.get(
  '/showtimes',
  validateRequest(BookingValidation.getShowtimesValidation),
  BookingController.getAllShowtimes
);

/**
 * @swagger
 * /v1/api/booking/showtimes/{id}:
 *   get:
 *     summary: Get showtime by ID
 *     tags: [Booking - Showtimes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Showtime retrieved successfully
 *       404:
 *         description: Showtime not found
 */
router.get('/showtimes/:id', BookingController.getShowtimeById);

/**
 * @swagger
 * /v1/api/booking/showtimes/{id}/seats:
 *   get:
 *     summary: Get available seats for a showtime
 *     tags: [Booking - Showtimes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Available seats retrieved successfully
 *       404:
 *         description: Showtime not found
 */
router.get('/showtimes/:id/seats', BookingController.getAvailableSeats);

// BOOKING ROUTES
/**
 * @swagger
 * /v1/api/booking/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Booking - Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Bad request (not enough seats, seats already booked, etc.)
 *       404:
 *         description: Showtime not found
 */
router.post(
  '/bookings',
  validateRequest(BookingValidation.createBookingValidation),
  BookingController.createBooking
);

/**
 * @swagger
 * /v1/api/booking/bookings:
 *   get:
 *     summary: Get all bookings with filtering and pagination
 *     tags: [Booking - Bookings]
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
 *         description: Number of bookings per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: showtimeId
 *         schema:
 *           type: string
 *         description: Filter by showtime ID
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: bookingStatus
 *         schema:
 *           type: string
 *           enum: [confirmed, cancelled, expired]
 *         description: Filter by booking status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter bookings from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter bookings until this date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [bookedAt, finalAmount, createdAt]
 *           default: bookedAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.get(
  '/bookings',
  validateRequest(BookingValidation.getBookingsValidation),
  BookingController.getAllBookings
);

/**
 * @swagger
 * /v1/api/booking/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Booking - Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       404:
 *         description: Booking not found
 */
router.get('/bookings/:id', BookingController.getBookingById);

/**
 * @swagger
 * /v1/api/booking/bookings/{id}/payment:
 *   post:
 *     summary: Process payment for a booking
 *     tags: [Booking - Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Payment already completed
 *       404:
 *         description: Booking not found
 */
router.post(
  '/bookings/:id/payment',
  validateRequest(BookingValidation.processPaymentValidation),
  BookingController.processPayment
);

/**
 * @swagger
 * /v1/api/booking/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking
 *     tags: [Booking - Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Booking already cancelled
 *       404:
 *         description: Booking not found
 */
router.put('/bookings/:id/cancel', BookingController.cancelBooking);

/**
 * @swagger
 * /v1/api/booking/bookings/{id}/ticket:
 *   get:
 *     summary: Get e-ticket for a booking
 *     tags: [Booking - Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
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
 *                   $ref: '#/components/schemas/ETicket'
 *       404:
 *         description: E-ticket not found
 */
router.get('/bookings/:id/ticket', BookingController.getETicket);

export const bookingRouter = router;
