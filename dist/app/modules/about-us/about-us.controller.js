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
exports.updateAboutUs = exports.getAboutUs = void 0;
const about_us_model_1 = require("./about-us.model");
const about_us_validation_1 = require("./about-us.validation");
const getAboutUs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let aboutUs = yield about_us_model_1.AboutUs.findOne();
        if (!aboutUs) {
            aboutUs = yield about_us_model_1.AboutUs.create({
                content: '<p>About Us content goes here.</p>'
            });
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "About Us retrieved successfully",
            data: aboutUs,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.getAboutUs = getAboutUs;
const updateAboutUs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const validatedData = about_us_validation_1.AboutUsValidation.parse({ content });
        let aboutUs = yield about_us_model_1.AboutUs.findOne();
        if (!aboutUs) {
            aboutUs = new about_us_model_1.AboutUs(validatedData);
            yield aboutUs.save();
        }
        else {
            aboutUs.content = content;
            yield aboutUs.save();
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "About Us updated successfully",
            data: aboutUs,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.updateAboutUs = updateAboutUs;
