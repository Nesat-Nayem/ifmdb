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
exports.deleteAdvertiseById = exports.updateAdvertiseById = exports.getAdvertiseById = exports.getAllAdvertisements = exports.createAdvertise = void 0;
const advertise_model_1 = require("./advertise.model");
const advertise_validation_1 = require("./advertise.validation");
const appError_1 = require("../../errors/appError");
const createAdvertise = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // require image uploaded via multer
        if (!req.file) {
            return next(new appError_1.appError('Image is required', 400));
        }
        const image = req.file.path; // cloudinary middleware should set this
        const status = req.body.status || 'active';
        const link = req.body.link;
        const validated = advertise_validation_1.advertiseCreateValidation.parse({ image, status, link });
        const ad = yield advertise_model_1.Advertise.create(validated);
        res.status(201).json({
            success: true,
            statusCode: 201,
            message: 'Advertisement created successfully',
            data: ad,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createAdvertise = createAdvertise;
const getAllAdvertisements = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ads = yield advertise_model_1.Advertise.find({ isDeleted: false }).sort({ createdAt: -1 });
        res.json({
            success: true,
            statusCode: 200,
            message: 'Advertisements retrieved successfully',
            data: ads,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllAdvertisements = getAllAdvertisements;
const getAdvertiseById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ad = yield advertise_model_1.Advertise.findOne({ _id: req.params.id, isDeleted: false });
        if (!ad)
            return next(new appError_1.appError('Advertisement not found', 404));
        res.json({
            success: true,
            statusCode: 200,
            message: 'Advertisement retrieved successfully',
            data: ad,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAdvertiseById = getAdvertiseById;
const updateAdvertiseById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ad = yield advertise_model_1.Advertise.findOne({ _id: req.params.id, isDeleted: false });
        if (!ad)
            return next(new appError_1.appError('Advertisement not found', 404));
        const updateData = {};
        if (req.file)
            updateData.image = req.file.path;
        if (req.body.status)
            updateData.status = req.body.status;
        if (req.body.link)
            updateData.link = req.body.link;
        if (Object.keys(updateData).length === 0) {
            return res.json({
                success: true,
                statusCode: 200,
                message: 'No changes to update',
                data: ad,
            });
        }
        const validated = advertise_validation_1.advertiseUpdateValidation.parse(updateData);
        const updated = yield advertise_model_1.Advertise.findByIdAndUpdate(req.params.id, validated, { new: true });
        res.json({
            success: true,
            statusCode: 200,
            message: 'Advertisement updated successfully',
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateAdvertiseById = updateAdvertiseById;
const deleteAdvertiseById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ad = yield advertise_model_1.Advertise.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
        if (!ad)
            return next(new appError_1.appError('Advertisement not found', 404));
        res.json({
            success: true,
            statusCode: 200,
            message: 'Advertisement deleted successfully',
            data: ad,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteAdvertiseById = deleteAdvertiseById;
