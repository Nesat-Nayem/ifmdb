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
exports.deleteHomepageCategoryById = exports.updateHomepageCategoryById = exports.getHomepageCategoryById = exports.getAllHomepageCategories = exports.createHomepageCategory = void 0;
const homepage_category_model_1 = require("./homepage-category.model");
const homepage_category_validation_1 = require("./homepage-category.validation");
const appError_1 = require("../../errors/appError");
const cloudinary_1 = require("../../config/cloudinary");
const createHomepageCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { title, isActive, order, link } = req.body;
        if (!req.file) {
            next(new appError_1.appError("Category image is required", 400));
            return;
        }
        const image = req.file.path;
        const validatedData = homepage_category_validation_1.homepageCategoryValidation.parse({
            title,
            image,
            link: link || '',
            isActive: isActive === 'true' || isActive === true,
            order: order ? parseInt(order) : undefined
        });
        const category = new homepage_category_model_1.HomepageCategory(validatedData);
        yield category.save();
        res.status(201).json({
            success: true,
            statusCode: 201,
            message: "Homepage category created successfully",
            data: category,
        });
        return;
    }
    catch (error) {
        if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) {
            const publicId = (_b = req.file.path.split('/').pop()) === null || _b === void 0 ? void 0 : _b.split('.')[0];
            if (publicId) {
                yield cloudinary_1.cloudinary.uploader.destroy(`restaurant-banners/${publicId}`);
            }
        }
        next(error);
    }
});
exports.createHomepageCategory = createHomepageCategory;
const getAllHomepageCategories = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { active } = req.query;
        const filter = { isDeleted: false };
        if (active === 'true') {
            filter.isActive = true;
        }
        const categories = yield homepage_category_model_1.HomepageCategory.find(filter).sort({ order: 1, createdAt: -1 });
        if (categories.length === 0) {
            res.json({
                success: true,
                statusCode: 200,
                message: "No homepage categories found",
                data: [],
            });
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Homepage categories retrieved successfully",
            data: categories,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.getAllHomepageCategories = getAllHomepageCategories;
const getHomepageCategoryById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield homepage_category_model_1.HomepageCategory.findOne({
            _id: req.params.id,
            isDeleted: false
        });
        if (!category) {
            return next(new appError_1.appError("Homepage category not found", 404));
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Homepage category retrieved successfully",
            data: category,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.getHomepageCategoryById = getHomepageCategoryById;
const updateHomepageCategoryById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const categoryId = req.params.id;
        const { title, isActive, order, link } = req.body;
        const category = yield homepage_category_model_1.HomepageCategory.findOne({
            _id: categoryId,
            isDeleted: false
        });
        if (!category) {
            next(new appError_1.appError("Homepage category not found", 404));
            return;
        }
        const updateData = {};
        if (title !== undefined) {
            updateData.title = title;
        }
        if (isActive !== undefined) {
            updateData.isActive = isActive === 'true' || isActive === true;
        }
        if (order !== undefined) {
            updateData.order = parseInt(order);
        }
        if (link !== undefined) {
            updateData.link = link;
        }
        if (req.file) {
            updateData.image = req.file.path;
            if (category.image) {
                const publicId = (_a = category.image.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('.')[0];
                if (publicId) {
                    yield cloudinary_1.cloudinary.uploader.destroy(`restaurant-banners/${publicId}`);
                }
            }
        }
        if (Object.keys(updateData).length > 0) {
            const validatedData = homepage_category_validation_1.homepageCategoryUpdateValidation.parse(updateData);
            const updatedCategory = yield homepage_category_model_1.HomepageCategory.findByIdAndUpdate(categoryId, validatedData, { new: true });
            res.json({
                success: true,
                statusCode: 200,
                message: "Homepage category updated successfully",
                data: updatedCategory,
            });
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "No changes to update",
            data: category,
        });
        return;
    }
    catch (error) {
        if ((_b = req.file) === null || _b === void 0 ? void 0 : _b.path) {
            const publicId = (_c = req.file.path.split('/').pop()) === null || _c === void 0 ? void 0 : _c.split('.')[0];
            if (publicId) {
                yield cloudinary_1.cloudinary.uploader.destroy(`restaurant-banners/${publicId}`);
            }
        }
        next(error);
    }
});
exports.updateHomepageCategoryById = updateHomepageCategoryById;
const deleteHomepageCategoryById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield homepage_category_model_1.HomepageCategory.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
        if (!category) {
            next(new appError_1.appError("Homepage category not found", 404));
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Homepage category deleted successfully",
            data: category,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.deleteHomepageCategoryById = deleteHomepageCategoryById;
