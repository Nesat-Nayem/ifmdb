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
exports.decideVendorApplication = exports.getVendorApplicationById = exports.listVendorApplications = exports.createVendorApplication = void 0;
const vendor_model_1 = require("./vendor.model");
const vendor_validation_1 = require("./vendor.validation");
const appError_1 = require("../../errors/appError");
const createVendorApplication = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { vendorName, businessType, gstNumber, panNumber, address, email, phone } = req.body;
        // Validate base fields
        const validated = vendor_validation_1.vendorCreateValidation.parse({ vendorName, businessType, gstNumber, panNumber, address, email, phone });
        // Build file URLs if provided via multer upload.fields
        const files = req.files;
        const aadharFrontUrl = ((_b = (_a = files === null || files === void 0 ? void 0 : files.aadharFront) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) || '';
        const aadharBackUrl = ((_d = (_c = files === null || files === void 0 ? void 0 : files.aadharBack) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.path) || '';
        const panImageUrl = ((_f = (_e = files === null || files === void 0 ? void 0 : files.panImage) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.path) || '';
        const doc = yield vendor_model_1.VendorApplication.create(Object.assign(Object.assign({ userId: (_g = req.user) === null || _g === void 0 ? void 0 : _g._id }, validated), { aadharFrontUrl,
            aadharBackUrl,
            panImageUrl, status: 'pending' }));
        res.status(201).json({
            success: true,
            statusCode: 201,
            message: 'Vendor application submitted successfully',
            data: doc,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createVendorApplication = createVendorApplication;
const listVendorApplications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, userId } = req.query;
        const filter = { isDeleted: false };
        if (status)
            filter.status = status;
        if (userId)
            filter.userId = userId;
        const items = yield vendor_model_1.VendorApplication.find(filter).sort({ createdAt: -1 });
        res.json({
            success: true,
            statusCode: 200,
            message: items.length ? 'Vendor applications retrieved successfully' : 'No vendor applications found',
            data: items,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.listVendorApplications = listVendorApplications;
const getVendorApplicationById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const item = yield vendor_model_1.VendorApplication.findOne({ _id: id, isDeleted: false });
        if (!item)
            return next(new appError_1.appError('Vendor application not found', 404));
        // If non-admin, only allow owner to view
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin' && String(item.userId) !== String((_b = req.user) === null || _b === void 0 ? void 0 : _b._id)) {
            return next(new appError_1.appError('You do not have permission to view this application', 403));
        }
        res.json({ success: true, statusCode: 200, message: 'Vendor application retrieved successfully', data: item });
    }
    catch (error) {
        next(error);
    }
});
exports.getVendorApplicationById = getVendorApplicationById;
const decideVendorApplication = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { decision, rejectionReason } = vendor_validation_1.vendorDecisionValidation.parse(req.body);
        const item = yield vendor_model_1.VendorApplication.findOne({ _id: id, isDeleted: false });
        if (!item)
            return next(new appError_1.appError('Vendor application not found', 404));
        if (item.status !== 'pending')
            return next(new appError_1.appError('Application already processed', 400));
        if (decision === 'approve') {
            item.status = 'approved';
            item.approvedAt = new Date();
            item.approvedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        }
        else {
            item.status = 'rejected';
            item.rejectionReason = rejectionReason || 'Not specified';
        }
        yield item.save();
        res.json({ success: true, statusCode: 200, message: `Application ${item.status}`, data: item });
    }
    catch (error) {
        next(error);
    }
});
exports.decideVendorApplication = decideVendorApplication;
