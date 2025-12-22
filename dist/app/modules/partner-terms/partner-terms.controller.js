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
exports.updatePartnerTerms = exports.getPartnerTerms = void 0;
const partner_terms_model_1 = require("./partner-terms.model");
const partner_terms_validation_1 = require("./partner-terms.validation");
const getPartnerTerms = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let partnerTerms = yield partner_terms_model_1.PartnerTerms.findOne();
        if (!partnerTerms) {
            partnerTerms = yield partner_terms_model_1.PartnerTerms.create({
                content: '<p>Partner Terms and Conditions content goes here.</p>'
            });
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Partner Terms and Conditions retrieved successfully",
            data: partnerTerms,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.getPartnerTerms = getPartnerTerms;
const updatePartnerTerms = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const validatedData = partner_terms_validation_1.PartnerTermsValidation.parse({ content });
        let partnerTerms = yield partner_terms_model_1.PartnerTerms.findOne();
        if (!partnerTerms) {
            partnerTerms = new partner_terms_model_1.PartnerTerms(validatedData);
            yield partnerTerms.save();
        }
        else {
            partnerTerms.content = content;
            yield partnerTerms.save();
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Partner Terms and Conditions updated successfully",
            data: partnerTerms,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.updatePartnerTerms = updatePartnerTerms;
