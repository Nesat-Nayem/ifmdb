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
exports.updateHelpCenter = exports.getHelpCenter = void 0;
const help_center_model_1 = require("./help-center.model");
const help_center_validation_1 = require("./help-center.validation");
const getHelpCenter = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let hc = yield help_center_model_1.HelpCenter.findOne();
        if (!hc) {
            hc = yield help_center_model_1.HelpCenter.create({ content: '<p>Help Center content goes here.</p>' });
        }
        res.json({
            success: true,
            statusCode: 200,
            message: 'Help Center retrieved successfully',
            data: hc,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getHelpCenter = getHelpCenter;
const updateHelpCenter = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const validated = help_center_validation_1.helpCenterValidation.parse({ content });
        let hc = yield help_center_model_1.HelpCenter.findOne();
        if (!hc) {
            hc = yield help_center_model_1.HelpCenter.create(validated);
        }
        else {
            hc.content = validated.content;
            yield hc.save();
        }
        res.json({
            success: true,
            statusCode: 200,
            message: 'Help Center updated successfully',
            data: hc,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateHelpCenter = updateHelpCenter;
