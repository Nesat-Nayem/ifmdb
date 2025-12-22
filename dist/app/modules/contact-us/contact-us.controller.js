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
exports.updateContactUs = exports.getContactUs = void 0;
const contact_us_model_1 = require("./contact-us.model");
const contact_us_validation_1 = require("./contact-us.validation");
const getContactUs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let contactUs = yield contact_us_model_1.ContactUs.findOne();
        if (!contactUs) {
            contactUs = yield contact_us_model_1.ContactUs.create({
                content: '<p>Contact Us content goes here.</p>'
            });
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Contact Us retrieved successfully",
            data: contactUs,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.getContactUs = getContactUs;
const updateContactUs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const validatedData = contact_us_validation_1.ContactUsValidation.parse({ content });
        let contactUs = yield contact_us_model_1.ContactUs.findOne();
        if (!contactUs) {
            contactUs = new contact_us_model_1.ContactUs(validatedData);
            yield contactUs.save();
        }
        else {
            contactUs.content = content;
            yield contactUs.save();
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Contact Us updated successfully",
            data: contactUs,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.updateContactUs = updateContactUs;
