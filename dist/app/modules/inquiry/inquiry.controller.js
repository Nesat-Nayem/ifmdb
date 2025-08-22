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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInquiryById = exports.updateInquiryById = exports.getInquiryById = exports.getAllInquiries = exports.createInquiry = void 0;
const inquiry_model_1 = require("./inquiry.model");
const inquiry_validation_1 = require("./inquiry.validation");
const appError_1 = require("../../errors/appError");
const createInquiry = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, phone, purpose, message } = req.body;
        const validated = inquiry_validation_1.inquiryCreateValidation.parse({ name, email, phone, purpose, message });
        const item = new inquiry_model_1.Inquiry(validated);
        yield item.save();
        res.status(201).json({
            success: true,
            statusCode: 201,
            message: 'Inquiry submitted successfully',
            data: item,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createInquiry = createInquiry;
const getAllInquiries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { purpose } = req.query;
        const filter = { isDeleted: false };
        if (purpose)
            filter.purpose = purpose;
        const items = yield inquiry_model_1.Inquiry.find(filter).sort({ createdAt: -1 });
        res.json({
            success: true,
            statusCode: 200,
            message: items.length ? 'Inquiries retrieved successfully' : 'No inquiries found',
            data: items,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllInquiries = getAllInquiries;
const getInquiryById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield inquiry_model_1.Inquiry.findOne({ _id: req.params.id, isDeleted: false });
        if (!item)
            return next(new appError_1.appError('Inquiry not found', 404));
        res.json({
            success: true,
            statusCode: 200,
            message: 'Inquiry retrieved successfully',
            data: item,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getInquiryById = getInquiryById;
const updateInquiryById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existing = yield inquiry_model_1.Inquiry.findOne({ _id: id, isDeleted: false });
        if (!existing)
            return next(new appError_1.appError('Inquiry not found', 404));
        const { name, email, phone, purpose, message } = req.body;
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (email !== undefined)
            updateData.email = email;
        if (phone !== undefined)
            updateData.phone = phone;
        if (purpose !== undefined)
            updateData.purpose = purpose;
        if (message !== undefined)
            updateData.message = message;
        const validated = inquiry_validation_1.inquiryUpdateValidation.parse(updateData);
        const updated = yield inquiry_model_1.Inquiry.findByIdAndUpdate(id, validated, { new: true });
        res.json({
            success: true,
            statusCode: 200,
            message: 'Inquiry updated successfully',
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateInquiryById = updateInquiryById;
const deleteInquiryById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updated = yield inquiry_model_1.Inquiry.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
        if (!updated)
            return next(new appError_1.appError('Inquiry not found', 404));
        res.json({
            success: true,
            statusCode: 200,
            message: 'Inquiry deleted successfully',
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteInquiryById = deleteInquiryById;
