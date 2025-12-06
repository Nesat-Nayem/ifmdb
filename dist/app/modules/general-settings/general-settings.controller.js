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
exports.updateGeneralSettings = exports.getGeneralSettings = void 0;
const general_settings_model_1 = require("./general-settings.model");
const general_settings_validation_1 = require("./general-settings.validation");
const getGeneralSettings = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let settings = yield general_settings_model_1.GeneralSettings.findOne();
        if (!settings) {
            settings = yield general_settings_model_1.GeneralSettings.create({});
        }
        res.json({
            success: true,
            statusCode: 200,
            message: 'General settings retrieved successfully',
            data: settings,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getGeneralSettings = getGeneralSettings;
const updateGeneralSettings = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validated = general_settings_validation_1.generalSettingsValidation.parse(req.body || {});
        // Handle uploaded files (logo and favicon)
        const files = req.files;
        // If logo was uploaded, get the Cloudinary URL
        if ((files === null || files === void 0 ? void 0 : files.logo) && files.logo[0]) {
            validated.logo = files.logo[0].path;
        }
        // If favicon was uploaded, get the Cloudinary URL
        if ((files === null || files === void 0 ? void 0 : files.favicon) && files.favicon[0]) {
            validated.favicon = files.favicon[0].path;
        }
        let settings = yield general_settings_model_1.GeneralSettings.findOne();
        if (!settings) {
            settings = yield general_settings_model_1.GeneralSettings.create(validated);
        }
        else {
            Object.assign(settings, validated);
            yield settings.save();
        }
        res.json({
            success: true,
            statusCode: 200,
            message: 'General settings updated successfully',
            data: settings,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateGeneralSettings = updateGeneralSettings;
