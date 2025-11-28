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
exports.EventCategoryController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const event_category_model_1 = __importDefault(require("./event-category.model"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
// Create a new event category
const createEventCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryData = req.body;
    // Handle image from multer/cloudinary
    if (req.file) {
        categoryData.image = req.file.path || req.file.filename;
    }
    const newCategory = yield event_category_model_1.default.create(categoryData);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Event category created successfully',
        data: newCategory
    });
}));
// Get all event categories with filtering
const getAllEventCategories = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 50, search, isMusicShow, isComedyShow, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    // Build filter query
    const filter = {};
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }
    if (isMusicShow !== undefined) {
        filter.isMusicShow = isMusicShow === 'true';
    }
    if (isComedyShow !== undefined) {
        filter.isComedyShow = isComedyShow === 'true';
    }
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const categories = yield event_category_model_1.default.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield event_category_model_1.default.countDocuments(filter);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event categories retrieved successfully',
        data: categories,
        meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
}));
// Get music show categories
const getMusicShowCategories = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield event_category_model_1.default.find({
        isMusicShow: true,
        isActive: true
    }).lean();
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Music show categories retrieved successfully',
        data: categories
    });
}));
// Get comedy show categories
const getComedyShowCategories = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield event_category_model_1.default.find({
        isComedyShow: true,
        isActive: true
    }).lean();
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Comedy show categories retrieved successfully',
        data: categories
    });
}));
// Get single event category by ID
const getEventCategoryById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const category = yield event_category_model_1.default.findById(id);
    if (!category) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event category not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event category retrieved successfully',
        data: category
    });
}));
// Update event category
const updateEventCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updateData = req.body;
    // Handle image from multer/cloudinary
    if (req.file) {
        updateData.image = req.file.path || req.file.filename;
    }
    const updatedCategory = yield event_category_model_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedCategory) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event category not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event category updated successfully',
        data: updatedCategory
    });
}));
// Delete event category (soft delete)
const deleteEventCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deletedCategory = yield event_category_model_1.default.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!deletedCategory) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event category not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event category deleted successfully',
        data: deletedCategory
    });
}));
// Hard delete event category
const hardDeleteEventCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deletedCategory = yield event_category_model_1.default.findByIdAndDelete(id);
    if (!deletedCategory) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_1.default.NOT_FOUND,
            success: false,
            message: 'Event category not found',
            data: null
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event category permanently deleted',
        data: deletedCategory
    });
}));
exports.EventCategoryController = {
    createEventCategory,
    getAllEventCategories,
    getMusicShowCategories,
    getComedyShowCategories,
    getEventCategoryById,
    updateEventCategory,
    deleteEventCategory,
    hardDeleteEventCategory
};
