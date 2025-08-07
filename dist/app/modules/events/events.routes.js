"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRouter = void 0;
const express_1 = __importDefault(require("express"));
const events_controller_1 = require("./events.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const events_validation_1 = require("./events.validation");
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
router.post('/', (0, validateRequest_1.default)(events_validation_1.EventValidation.createEventValidation), events_controller_1.EventController.createEvent);
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
router.get('/', (0, validateRequest_1.default)(events_validation_1.EventValidation.getEventsValidation), events_controller_1.EventController.getAllEvents);
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
exports.eventRouter = router;
