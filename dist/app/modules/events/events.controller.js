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
exports.EventController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const events_model_1 = __importDefault(require("./events.model"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
// Create a new event
const createEvent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventData = req.body;
    const newEvent = yield events_model_1.default.create(eventData);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Event created successfully',
        data: newEvent
    });
}));
// Get all events with filtering, searching, and pagination
const getAllEvents = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search, eventType, category, categoryId, language, city, status, startDate, endDate, minPrice, maxPrice, sortBy = 'startDate', sortOrder = 'asc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    // Build filter query
    const filter = { isActive: true };
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }
    if (eventType)
        filter.eventType = eventType;
    if (category)
        filter.category = category;
    if (categoryId)
        filter.categoryId = categoryId;
    if (language)
        filter.language = { $regex: language, $options: 'i' };
    if (city)
        filter['location.city'] = { $regex: city, $options: 'i' };
    if (status)
        filter.status = status;
    // Date range filter
    if (startDate || endDate) {
        filter.startDate = {};
        if (startDate)
            filter.startDate.$gte = new Date(startDate);
        if (endDate)
            filter.startDate.$lte = new Date(endDate);
    }
    // Price range filter
    if (minPrice || maxPrice) {
        filter.ticketPrice = {};
        if (minPrice)
            filter.ticketPrice.$gte = parseFloat(minPrice);
        if (maxPrice)
            filter.ticketPrice.$lte = parseFloat(maxPrice);
    }
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const events = yield events_model_1.default.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield events_model_1.default.countDocuments(filter);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Events retrieved successfully',
        data: events,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
// Get single event by ID
const getEventById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const event = yield events_model_1.default.findById(id);
    if (!event) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event retrieved successfully',
        data: event
    });
}));
// Update event
const updateEvent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updateData = req.body;
    const updatedEvent = yield events_model_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedEvent) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent
    });
}));
// Delete event (soft delete)
const deleteEvent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deletedEvent = yield events_model_1.default.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!deletedEvent) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event deleted successfully',
        data: deletedEvent
    });
}));
// Get events by type
const getEventsByType = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const events = yield events_model_1.default.find({
        eventType: type,
        isActive: true,
        status: { $in: ['upcoming', 'ongoing'] }
    })
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield events_model_1.default.countDocuments({
        eventType: type,
        isActive: true,
        status: { $in: ['upcoming', 'ongoing'] }
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `${type} events retrieved successfully`,
        data: events,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
// Get upcoming events
const getUpcomingEvents = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const currentDate = new Date();
    const events = yield events_model_1.default.find({
        startDate: { $gte: currentDate },
        status: 'upcoming',
        isActive: true
    })
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield events_model_1.default.countDocuments({
        startDate: { $gte: currentDate },
        status: 'upcoming',
        isActive: true
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Upcoming events retrieved successfully',
        data: events,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
// Get events by location/city
const getEventsByLocation = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { city } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const events = yield events_model_1.default.find({
        'location.city': { $regex: city, $options: 'i' },
        isActive: true,
        status: { $in: ['upcoming', 'ongoing'] }
    })
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield events_model_1.default.countDocuments({
        'location.city': { $regex: city, $options: 'i' },
        isActive: true,
        status: { $in: ['upcoming', 'ongoing'] }
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Events in ${city} retrieved successfully`,
        data: events,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
// Get best events this week (sorted by ticket sales)
const getBestEventsThisWeek = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    // Get start and end of current week
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const events = yield events_model_1.default.find({
        isActive: true,
        status: { $in: ['upcoming', 'ongoing'] },
        startDate: { $gte: new Date(), $lte: endOfWeek }
    })
        .sort({ totalTicketsSold: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('categoryId', 'name image')
        .lean();
    const total = yield events_model_1.default.countDocuments({
        isActive: true,
        status: { $in: ['upcoming', 'ongoing'] },
        startDate: { $gte: new Date(), $lte: endOfWeek }
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Best events this week retrieved successfully',
        data: events,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
// Get events by category ID
const getEventsByCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const events = yield events_model_1.default.find({
        categoryId,
        isActive: true,
        status: { $in: ['upcoming', 'ongoing'] }
    })
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('categoryId', 'name image')
        .lean();
    const total = yield events_model_1.default.countDocuments({
        categoryId,
        isActive: true,
        status: { $in: ['upcoming', 'ongoing'] }
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Events by category retrieved successfully',
        data: events,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
// Get events by language
const getEventsByLanguage = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { language } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const events = yield events_model_1.default.find({
        language: { $regex: language, $options: 'i' },
        isActive: true,
        status: { $in: ['upcoming', 'ongoing'] }
    })
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('categoryId', 'name image')
        .lean();
    const total = yield events_model_1.default.countDocuments({
        language: { $regex: language, $options: 'i' },
        isActive: true,
        status: { $in: ['upcoming', 'ongoing'] }
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Events in ${language} retrieved successfully`,
        data: events,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
exports.EventController = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventsByType,
    getUpcomingEvents,
    getEventsByLocation,
    getBestEventsThisWeek,
    getEventsByCategory,
    getEventsByLanguage
};
