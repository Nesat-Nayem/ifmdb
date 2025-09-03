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
exports.deleteSubscriptionPlanById = exports.updateSubscriptionPlanById = exports.getSubscriptionPlanById = exports.getAllSubscriptionPlans = exports.createSubscriptionPlan = void 0;
const subscription_plan_model_1 = require("./subscription-plan.model");
const subscription_plan_validation_1 = require("./subscription-plan.validation");
const appError_1 = require("../../errors/appError");
const createSubscriptionPlan = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = subscription_plan_validation_1.subscriptionPlanCreateValidation.parse(req.body);
        const created = yield subscription_plan_model_1.SubscriptionPlan.create(payload);
        res.status(201).json({
            success: true,
            statusCode: 201,
            message: 'Subscription plan created successfully',
            data: created,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createSubscriptionPlan = createSubscriptionPlan;
const getAllSubscriptionPlans = (_req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield subscription_plan_model_1.SubscriptionPlan.find({ isDeleted: false }).sort({ createdAt: -1 });
        res.json({ success: true, statusCode: 200, message: 'Subscription plans retrieved successfully', data });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllSubscriptionPlans = getAllSubscriptionPlans;
const getSubscriptionPlanById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plan = yield subscription_plan_model_1.SubscriptionPlan.findOne({ _id: req.params.id, isDeleted: false });
        if (!plan)
            return next(new appError_1.appError('Subscription plan not found', 404));
        res.json({ success: true, statusCode: 200, message: 'Subscription plan retrieved successfully', data: plan });
    }
    catch (error) {
        next(error);
    }
});
exports.getSubscriptionPlanById = getSubscriptionPlanById;
const updateSubscriptionPlanById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plan = yield subscription_plan_model_1.SubscriptionPlan.findOne({ _id: req.params.id, isDeleted: false });
        if (!plan)
            return next(new appError_1.appError('Subscription plan not found', 404));
        const payload = subscription_plan_validation_1.subscriptionPlanUpdateValidation.parse(req.body);
        const updated = yield subscription_plan_model_1.SubscriptionPlan.findByIdAndUpdate(req.params.id, payload, { new: true });
        res.json({ success: true, statusCode: 200, message: 'Subscription plan updated successfully', data: updated });
    }
    catch (error) {
        next(error);
    }
});
exports.updateSubscriptionPlanById = updateSubscriptionPlanById;
const deleteSubscriptionPlanById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plan = yield subscription_plan_model_1.SubscriptionPlan.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
        if (!plan)
            return next(new appError_1.appError('Subscription plan not found', 404));
        res.json({ success: true, statusCode: 200, message: 'Subscription plan deleted successfully', data: plan });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteSubscriptionPlanById = deleteSubscriptionPlanById;
