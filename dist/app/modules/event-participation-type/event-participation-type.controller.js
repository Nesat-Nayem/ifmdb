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
exports.EventParticipationTypeController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const event_participation_type_model_1 = __importDefault(require("./event-participation-type.model"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const createParticipationType = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description } = req.body;
    const exists = yield event_participation_type_model_1.default.findOne({ name: name === null || name === void 0 ? void 0 : name.trim() });
    if (exists) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Participation type with this name already exists',
            data: null,
        });
    }
    const created = yield event_participation_type_model_1.default.create({ name: name === null || name === void 0 ? void 0 : name.trim(), description });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Participation type created successfully',
        data: created,
    });
}));
const getAllParticipationTypes = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 50, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (search)
        filter.name = { $regex: search, $options: 'i' };
    if (isActive !== undefined)
        filter.isActive = isActive === 'true';
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const [types, total] = yield Promise.all([
        event_participation_type_model_1.default.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean(),
        event_participation_type_model_1.default.countDocuments(filter),
    ]);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Participation types retrieved successfully',
        data: types,
        meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
}));
const getActiveParticipationTypes = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const types = yield event_participation_type_model_1.default.find({ isActive: true }).sort({ name: 1 }).lean();
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Active participation types retrieved successfully',
        data: types,
    });
}));
const getParticipationTypeById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const type = yield event_participation_type_model_1.default.findById(id);
    if (!type) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Participation type not found',
            data: null,
        });
    }
    (0, sendResponse_1.sendResponse)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Participation type retrieved', data: type });
}));
const updateParticipationType = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    if (name) {
        const exists = yield event_participation_type_model_1.default.findOne({ name: name.trim(), _id: { $ne: id } });
        if (exists) {
            return (0, sendResponse_1.sendResponse)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Participation type with this name already exists',
                data: null,
            });
        }
    }
    const payload = {};
    if (name !== undefined)
        payload.name = name.trim();
    if (description !== undefined)
        payload.description = description;
    if (isActive !== undefined)
        payload.isActive = isActive;
    const updated = yield event_participation_type_model_1.default.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Participation type not found',
            data: null,
        });
    }
    (0, sendResponse_1.sendResponse)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Participation type updated successfully', data: updated });
}));
const deleteParticipationType = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deleted = yield event_participation_type_model_1.default.findByIdAndDelete(id);
    if (!deleted) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Participation type not found',
            data: null,
        });
    }
    (0, sendResponse_1.sendResponse)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Participation type deleted successfully', data: deleted });
}));
exports.EventParticipationTypeController = {
    createParticipationType,
    getAllParticipationTypes,
    getActiveParticipationTypes,
    getParticipationTypeById,
    updateParticipationType,
    deleteParticipationType,
};
