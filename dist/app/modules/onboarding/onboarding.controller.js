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
exports.deleteOnboardingById = exports.updateOnboardingById = exports.getOnboardingById = exports.getAllOnboarding = exports.createOnboarding = void 0;
const onboarding_model_1 = require("./onboarding.model");
const onboarding_validation_1 = require("./onboarding.validation");
const appError_1 = require("../../errors/appError");
const createOnboarding = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, subtitle, status, metaTitle, metaTags, metaDescription } = req.body;
        if (!req.file) {
            next(new appError_1.appError('Onboarding image is required', 400));
            return;
        }
        const image = req.file.path;
        const parsedMetaTags = Array.isArray(metaTags)
            ? metaTags
            : typeof metaTags === 'string' && metaTags.trim().length
                ? metaTags.split(',').map((t) => t.trim()).filter(Boolean)
                : undefined;
        const validated = onboarding_validation_1.onboardingCreateValidation.parse({
            title,
            subtitle,
            image,
            status,
            metaTitle,
            metaTags: parsedMetaTags,
            metaDescription,
        });
        const item = new onboarding_model_1.Onboarding(validated);
        yield item.save();
        res.status(201).json({
            success: true,
            statusCode: 201,
            message: 'Onboarding created successfully',
            data: item,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createOnboarding = createOnboarding;
const getAllOnboarding = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.query;
        const filter = { isDeleted: false };
        if (status && ['active', 'inactive'].includes(status)) {
            filter.status = status;
        }
        const items = yield onboarding_model_1.Onboarding.find(filter).sort({ createdAt: -1 });
        res.json({
            success: true,
            statusCode: 200,
            message: items.length ? 'Onboarding list retrieved successfully' : 'No onboarding items found',
            data: items,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllOnboarding = getAllOnboarding;
const getOnboardingById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield onboarding_model_1.Onboarding.findOne({ _id: req.params.id, isDeleted: false });
        if (!item) {
            next(new appError_1.appError('Onboarding item not found', 404));
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: 'Onboarding item retrieved successfully',
            data: item,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getOnboardingById = getOnboardingById;
const updateOnboardingById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existing = yield onboarding_model_1.Onboarding.findOne({ _id: id, isDeleted: false });
        if (!existing) {
            next(new appError_1.appError('Onboarding item not found', 404));
            return;
        }
        const { title, subtitle, status, metaTitle, metaTags, metaDescription } = req.body;
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (subtitle !== undefined)
            updateData.subtitle = subtitle;
        if (status !== undefined)
            updateData.status = status;
        if (metaTitle !== undefined)
            updateData.metaTitle = metaTitle;
        if (metaDescription !== undefined)
            updateData.metaDescription = metaDescription;
        if (metaTags !== undefined) {
            updateData.metaTags = Array.isArray(metaTags)
                ? metaTags
                : typeof metaTags === 'string' && metaTags.trim().length
                    ? metaTags.split(',').map((t) => t.trim()).filter(Boolean)
                    : [];
        }
        if (req.file) {
            updateData.image = req.file.path;
        }
        const validated = onboarding_validation_1.onboardingUpdateValidation.parse(updateData);
        const updated = yield onboarding_model_1.Onboarding.findByIdAndUpdate(id, validated, { new: true });
        res.json({
            success: true,
            statusCode: 200,
            message: 'Onboarding item updated successfully',
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateOnboardingById = updateOnboardingById;
const deleteOnboardingById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updated = yield onboarding_model_1.Onboarding.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
        if (!updated) {
            next(new appError_1.appError('Onboarding item not found', 404));
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: 'Onboarding item deleted successfully',
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteOnboardingById = deleteOnboardingById;
