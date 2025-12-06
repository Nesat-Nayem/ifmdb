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
exports.deleteVendorApplication = exports.decideVendorApplication = exports.getVendorApplicationById = exports.listVendorApplications = exports.createVendorApplication = exports.updatePlatformSetting = exports.getPlatformSettings = exports.deleteVendorPackage = exports.updateVendorPackage = exports.getVendorPackageById = exports.listVendorPackages = exports.createVendorPackage = void 0;
const vendor_model_1 = require("./vendor.model");
const vendorPackage_model_1 = require("./vendorPackage.model");
const platformSettings_model_1 = require("./platformSettings.model");
const auth_model_1 = require("../auth/auth.model");
const vendor_validation_1 = require("./vendor.validation");
const appError_1 = require("../../errors/appError");
const emailService_1 = require("../../services/emailService");
// ============ VENDOR PACKAGES ============
const createVendorPackage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, price, duration, durationType, features, isPopular, sortOrder } = req.body;
        const existing = yield vendorPackage_model_1.VendorPackage.findOne({ name });
        if (existing)
            return next(new appError_1.appError('Package with this name already exists', 400));
        const doc = yield vendorPackage_model_1.VendorPackage.create({
            name,
            description,
            price,
            duration,
            durationType,
            features: features || [],
            isPopular: isPopular || false,
            sortOrder: sortOrder || 0,
        });
        res.status(201).json({ success: true, statusCode: 201, message: 'Package created successfully', data: doc });
    }
    catch (error) {
        next(error);
    }
});
exports.createVendorPackage = createVendorPackage;
const listVendorPackages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { activeOnly } = req.query;
        const filter = {};
        if (activeOnly === 'true')
            filter.isActive = true;
        const packages = yield vendorPackage_model_1.VendorPackage.find(filter).sort({ sortOrder: 1, price: 1 });
        res.json({ success: true, statusCode: 200, message: 'Packages retrieved', data: packages });
    }
    catch (error) {
        next(error);
    }
});
exports.listVendorPackages = listVendorPackages;
const getVendorPackageById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pkg = yield vendorPackage_model_1.VendorPackage.findById(req.params.id);
        if (!pkg)
            return next(new appError_1.appError('Package not found', 404));
        res.json({ success: true, statusCode: 200, message: 'Package retrieved', data: pkg });
    }
    catch (error) {
        next(error);
    }
});
exports.getVendorPackageById = getVendorPackageById;
const updateVendorPackage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pkg = yield vendorPackage_model_1.VendorPackage.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!pkg)
            return next(new appError_1.appError('Package not found', 404));
        res.json({ success: true, statusCode: 200, message: 'Package updated', data: pkg });
    }
    catch (error) {
        next(error);
    }
});
exports.updateVendorPackage = updateVendorPackage;
const deleteVendorPackage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pkg = yield vendorPackage_model_1.VendorPackage.findByIdAndDelete(req.params.id);
        if (!pkg)
            return next(new appError_1.appError('Package not found', 404));
        res.json({ success: true, statusCode: 200, message: 'Package deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteVendorPackage = deleteVendorPackage;
// ============ PLATFORM SETTINGS ============
const getPlatformSettings = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Ensure defaults exist
        yield ((_b = (_a = platformSettings_model_1.PlatformSettings).ensureDefaults) === null || _b === void 0 ? void 0 : _b.call(_a));
        const settings = yield platformSettings_model_1.PlatformSettings.find({});
        res.json({ success: true, statusCode: 200, message: 'Settings retrieved', data: settings });
    }
    catch (error) {
        next(error);
    }
});
exports.getPlatformSettings = getPlatformSettings;
const updatePlatformSetting = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { key, value } = req.body;
        const setting = yield platformSettings_model_1.PlatformSettings.findOneAndUpdate({ key }, { value, updatedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, { new: true });
        if (!setting)
            return next(new appError_1.appError('Setting not found', 404));
        res.json({ success: true, statusCode: 200, message: 'Setting updated', data: setting });
    }
    catch (error) {
        next(error);
    }
});
exports.updatePlatformSetting = updatePlatformSetting;
// ============ VENDOR APPLICATIONS ============
const createVendorApplication = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { vendorName, businessType, gstNumber, panNumber, address, email, phone, selectedServices, paymentInfo } = req.body;
        // Validate base fields
        const validated = vendor_validation_1.vendorCreateValidation.parse({ vendorName, businessType, gstNumber, panNumber, address, email, phone });
        // Check if application already exists with this email
        const existingApp = yield vendor_model_1.VendorApplication.findOne({ email, status: { $in: ['pending', 'approved'] } });
        if (existingApp) {
            return next(new appError_1.appError('An application with this email already exists', 400));
        }
        // Parse services
        let services = [];
        let totalAmount = 0;
        let requiresPayment = false;
        if (selectedServices) {
            const parsedServices = typeof selectedServices === 'string' ? JSON.parse(selectedServices) : selectedServices;
            for (const svc of parsedServices) {
                const serviceData = { serviceType: svc.serviceType };
                if (svc.serviceType === 'film_trade' && svc.packageId) {
                    const pkg = yield vendorPackage_model_1.VendorPackage.findById(svc.packageId);
                    if (pkg) {
                        serviceData.packageId = pkg._id;
                        serviceData.packageName = pkg.name;
                        serviceData.packagePrice = pkg.price;
                        totalAmount += pkg.price;
                        requiresPayment = true;
                    }
                }
                else if (svc.serviceType === 'events') {
                    const setting = yield platformSettings_model_1.PlatformSettings.findOne({ key: 'event_platform_fee' });
                    serviceData.platformFee = (setting === null || setting === void 0 ? void 0 : setting.value) || 20;
                }
                else if (svc.serviceType === 'movie_watch') {
                    const setting = yield platformSettings_model_1.PlatformSettings.findOne({ key: 'movie_watch_platform_fee' });
                    serviceData.platformFee = (setting === null || setting === void 0 ? void 0 : setting.value) || 50;
                }
                services.push(serviceData);
            }
        }
        // Build file URLs if provided via multer upload.fields
        const files = req.files;
        const aadharFrontUrl = ((_b = (_a = files === null || files === void 0 ? void 0 : files.aadharFrontUrl) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) || '';
        const aadharBackUrl = ((_d = (_c = files === null || files === void 0 ? void 0 : files.aadharBackUrl) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.path) || '';
        const panImageUrl = ((_f = (_e = files === null || files === void 0 ? void 0 : files.panImageUrl) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.path) || '';
        // Parse payment info if provided
        let parsedPaymentInfo;
        if (paymentInfo) {
            parsedPaymentInfo = typeof paymentInfo === 'string' ? JSON.parse(paymentInfo) : paymentInfo;
        }
        const doc = yield vendor_model_1.VendorApplication.create(Object.assign(Object.assign({ userId: (_g = req.user) === null || _g === void 0 ? void 0 : _g._id }, validated), { aadharFrontUrl,
            aadharBackUrl,
            panImageUrl, selectedServices: services, paymentInfo: requiresPayment ? {
                amount: totalAmount,
                status: (parsedPaymentInfo === null || parsedPaymentInfo === void 0 ? void 0 : parsedPaymentInfo.status) || 'pending',
                transactionId: parsedPaymentInfo === null || parsedPaymentInfo === void 0 ? void 0 : parsedPaymentInfo.transactionId,
                paymentMethod: parsedPaymentInfo === null || parsedPaymentInfo === void 0 ? void 0 : parsedPaymentInfo.paymentMethod,
                paidAt: (parsedPaymentInfo === null || parsedPaymentInfo === void 0 ? void 0 : parsedPaymentInfo.status) === 'completed' ? new Date() : undefined,
            } : undefined, requiresPayment,
            totalAmount, status: 'pending' }));
        // Send confirmation email
        try {
            const template = emailService_1.emailTemplates.vendorApplicationReceived(vendorName);
            yield (0, emailService_1.sendEmail)(Object.assign({ to: email }, template));
        }
        catch (emailErr) {
            console.error('Failed to send confirmation email:', emailErr);
        }
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
        const items = yield vendor_model_1.VendorApplication.find(filter)
            .populate('selectedServices.packageId')
            .sort({ createdAt: -1 });
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
        const item = yield vendor_model_1.VendorApplication.findOne({ _id: id, isDeleted: false })
            .populate('selectedServices.packageId');
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
        // Check payment for film_trade if required
        if (decision === 'approve' && item.requiresPayment) {
            if (!item.paymentInfo || item.paymentInfo.status !== 'completed') {
                return next(new appError_1.appError('Payment not completed for this application', 400));
            }
        }
        if (decision === 'approve') {
            // Generate password and create vendor user
            const password = (0, emailService_1.generatePassword)();
            // Check if user already exists
            let vendorUser = yield auth_model_1.User.findOne({ email: item.email });
            if (vendorUser) {
                // Update existing user to vendor
                vendorUser.role = 'vendor';
                vendorUser.password = password;
                // Add vendor services to user
                const serviceTypes = item.selectedServices.map(s => s.serviceType);
                vendorUser.vendorServices = serviceTypes;
                yield vendorUser.save();
            }
            else {
                // Create new vendor user
                const serviceTypes = item.selectedServices.map(s => s.serviceType);
                vendorUser = yield auth_model_1.User.create({
                    name: item.vendorName,
                    email: item.email,
                    phone: item.phone,
                    password,
                    role: 'vendor',
                    authProvider: 'local',
                    vendorServices: serviceTypes,
                });
            }
            item.status = 'approved';
            item.approvedAt = new Date();
            item.approvedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            item.vendorUserId = vendorUser._id;
            yield item.save();
            // Send approval email with credentials
            const serviceNames = item.selectedServices.map(s => {
                if (s.serviceType === 'film_trade')
                    return `Film Trade (${s.packageName})`;
                if (s.serviceType === 'events')
                    return `Events (${s.platformFee}% platform fee)`;
                if (s.serviceType === 'movie_watch')
                    return `Movie Watch (${s.platformFee}% platform fee)`;
                return s.serviceType;
            });
            const panelUrl = process.env.VENDOR_PANEL_URL || 'http://localhost:3001';
            try {
                const template = emailService_1.emailTemplates.vendorApproved(item.vendorName, item.email, password, serviceNames, panelUrl);
                yield (0, emailService_1.sendEmail)(Object.assign({ to: item.email }, template));
            }
            catch (emailErr) {
                console.error('Failed to send approval email:', emailErr);
            }
            res.json({
                success: true,
                statusCode: 200,
                message: 'Application approved. Credentials sent to vendor email.',
                data: item
            });
        }
        else {
            item.status = 'rejected';
            item.rejectionReason = rejectionReason || 'Not specified';
            yield item.save();
            // Send rejection email
            try {
                const template = emailService_1.emailTemplates.vendorRejected(item.vendorName, item.rejectionReason);
                yield (0, emailService_1.sendEmail)(Object.assign({ to: item.email }, template));
            }
            catch (emailErr) {
                console.error('Failed to send rejection email:', emailErr);
            }
            res.json({ success: true, statusCode: 200, message: 'Application rejected', data: item });
        }
    }
    catch (error) {
        next(error);
    }
});
exports.decideVendorApplication = decideVendorApplication;
const deleteVendorApplication = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const item = yield vendor_model_1.VendorApplication.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!item)
            return next(new appError_1.appError('Vendor application not found', 404));
        res.json({ success: true, statusCode: 200, message: 'Application deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteVendorApplication = deleteVendorApplication;
