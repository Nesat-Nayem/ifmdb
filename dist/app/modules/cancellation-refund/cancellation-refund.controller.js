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
exports.updateCancellationRefund = exports.getCancellationRefund = void 0;
const cancellation_refund_model_1 = require("./cancellation-refund.model");
const cancellation_refund_validation_1 = require("./cancellation-refund.validation");
const getCancellationRefund = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let cancellationRefund = yield cancellation_refund_model_1.CancellationRefund.findOne();
        if (!cancellationRefund) {
            cancellationRefund = yield cancellation_refund_model_1.CancellationRefund.create({
                content: '<p>Cancellation & Refund Policy content goes here.</p>'
            });
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Cancellation & Refund Policy retrieved successfully",
            data: cancellationRefund,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.getCancellationRefund = getCancellationRefund;
const updateCancellationRefund = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const validatedData = cancellation_refund_validation_1.CancellationRefundValidation.parse({ content });
        let cancellationRefund = yield cancellation_refund_model_1.CancellationRefund.findOne();
        if (!cancellationRefund) {
            cancellationRefund = new cancellation_refund_model_1.CancellationRefund(validatedData);
            yield cancellationRefund.save();
        }
        else {
            cancellationRefund.content = content;
            yield cancellationRefund.save();
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Cancellation & Refund Policy updated successfully",
            data: cancellationRefund,
        });
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.updateCancellationRefund = updateCancellationRefund;
