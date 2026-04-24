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
exports.EventTypeController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const event_type_model_1 = __importDefault(require("./event-type.model"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const createEventType = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title } = req.body;
    if (!title || !String(title).trim()) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Title is required',
            data: null,
        });
    }
    const exists = yield event_type_model_1.default.findOne({ title: String(title).trim() });
    if (exists) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Event type with this title already exists',
            data: null,
        });
    }
    const created = yield event_type_model_1.default.create({ title: String(title).trim() });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Event type created successfully',
        data: created,
    });
}));
const getAllEventTypes = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 50, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (search)
        filter.title = { $regex: search, $options: 'i' };
    if (isActive !== undefined)
        filter.isActive = isActive === 'true';
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const [types, total] = yield Promise.all([
        event_type_model_1.default.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean(),
        event_type_model_1.default.countDocuments(filter),
    ]);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event types retrieved successfully',
        data: types,
        meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
}));
const getActiveEventTypes = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const types = yield event_type_model_1.default.find({ isActive: true }).sort({ title: 1 }).lean();
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Active event types retrieved successfully',
        data: types,
    });
}));
const getEventTypeById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const type = yield event_type_model_1.default.findById(id);
    if (!type) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event type not found',
            data: null,
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event type retrieved',
        data: type,
    });
}));
const updateEventType = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, isActive } = req.body;
    if (title !== undefined) {
        const trimmed = String(title).trim();
        if (!trimmed) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Title cannot be empty',
                data: null,
            });
        }
        const exists = yield event_type_model_1.default.findOne({ title: trimmed, _id: { $ne: id } });
        if (exists) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Event type with this title already exists',
                data: null,
            });
        }
    }
    const payload = {};
    if (title !== undefined)
        payload.title = String(title).trim();
    if (isActive !== undefined)
        payload.isActive = isActive;
    const updated = yield event_type_model_1.default.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event type not found',
            data: null,
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event type updated successfully',
        data: updated,
    });
}));
const deleteEventType = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deleted = yield event_type_model_1.default.findByIdAndDelete(id);
    if (!deleted) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event type not found',
            data: null,
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event type deleted successfully',
        data: deleted,
    });
}));
exports.EventTypeController = {
    createEventType,
    getAllEventTypes,
    getActiveEventTypes,
    getEventTypeById,
    updateEventType,
    deleteEventType,
};
