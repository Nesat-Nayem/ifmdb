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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.changePassword = exports.updateProfile = exports.googleAuth = exports.checkEmailExists = exports.checkPhoneExists = exports.activateUser = exports.resetPassword = exports.getUserById = exports.getAllUsers = exports.loginController = exports.updateUser = exports.verifyOtp = exports.requestOtp = exports.singUpController = void 0;
const auth_model_1 = require("./auth.model");
const auth_validation_1 = require("./auth.validation");
const generateToken_1 = require("../../config/generateToken");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// import { AdminStaff } from "../admin-staff/admin-staff.model";
const singUpController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, password, img, phone, email, role } = auth_validation_1.authValidation.parse(req.body);
        // Check for existing email
        const existingEmail = yield auth_model_1.User.findOne({ email });
        if (existingEmail) {
            res.status(400).json({
                success: false,
                statusCode: 400,
                message: "Email already exists",
            });
            return;
        }
        // Check for existing phone
        const existingPhone = yield auth_model_1.User.findOne({ phone });
        if (existingPhone) {
            res.status(400).json({
                success: false,
                statusCode: 400,
                message: "Phone number already exists",
            });
            return;
        }
        const user = new auth_model_1.User({ name, password, img, phone, email, role, authProvider: 'local' });
        yield user.save();
        const _a = user.toObject(), { password: _ } = _a, userObject = __rest(_a, ["password"]);
        res.status(201).json({
            success: true,
            statusCode: 200,
            message: "User registered successfully",
            data: userObject,
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 500,
            message: error.message
        });
    }
});
exports.singUpController = singUpController;
// Add these functions to your existing controller file
// Utility function to generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
// Request OTP handler
const requestOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone } = auth_validation_1.requestOtpValidation.parse(req.body);
        // Find or create user
        let user = yield auth_model_1.User.findOne({ phone });
        if (!user) {
            user = new auth_model_1.User({
                phone,
                role: 'user',
                status: 'active',
                authProvider: 'phone'
            });
        }
        else if (!user.authProvider) {
            user.authProvider = 'phone';
        }
        // Generate OTP and set expiration
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        yield user.save();
        res.json({
            success: true,
            statusCode: 200,
            message: "OTP sent successfully",
            data: {
                otp,
                phone
            }
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
    }
});
exports.requestOtp = requestOtp;
// Verify OTP and login
const verifyOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, otp } = auth_validation_1.verifyOtpValidation.parse(req.body);
        // Find user by phone
        const user = yield auth_model_1.User.findOne({ phone });
        if (!user) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "User not found"
            });
            return;
        }
        // Check if OTP is valid and not expired
        if (!user.compareOtp(otp)) {
            res.status(401).json({
                success: false,
                statusCode: 401,
                message: "Invalid or expired OTP"
            });
            return;
        }
        // Generate token for the user
        const token = (0, generateToken_1.generateToken)(user);
        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpires = undefined;
        yield user.save();
        // Remove password from response
        const _a = user.toObject(), { password: _ } = _a, userObject = __rest(_a, ["password"]);
        res.json({
            success: true,
            statusCode: 200,
            message: "OTP verified successfully",
            token,
            data: userObject
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
    }
});
exports.verifyOtp = verifyOtp;
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create a clean request body by filtering out undefined/null values
        const cleanBody = Object.fromEntries(Object.entries(req.body).filter(([_, v]) => v !== undefined && v !== null));
        // Validate the clean data
        const validatedData = auth_validation_1.updateUserValidation.parse(cleanBody);
        // Check if email is being updated with a non-empty value and if it already exists
        if (validatedData.email && validatedData.email.length > 0) {
            const existingUser = yield auth_model_1.User.findOne({
                email: validatedData.email,
                _id: { $ne: req.params.id }
            });
            if (existingUser) {
                res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: "Email already exists"
                });
                return;
            }
        }
        // If email is empty string, remove it from update data
        if (validatedData.email === '') {
            delete validatedData.email;
        }
        const updatedUser = yield auth_model_1.User.findByIdAndUpdate(req.params.id, validatedData, { new: true, select: '-password' });
        if (!updatedUser) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "User not found"
            });
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "User updated successfully",
            data: updatedUser
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
    }
});
exports.updateUser = updateUser;
const loginController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = auth_validation_1.loginValidation.parse(req.body);
        // First try to find in User model
        let user = yield auth_model_1.User.findOne({ email });
        let userType = 'user';
        // If not found in User model, try AdminStaff model
        // if (!user) {
        //   user = await AdminStaff.findOne({ email });
        //   userType = 'admin-staff';
        // }
        if (!user) {
            res.status(401).json({
                success: false,
                statusCode: 400,
                message: "Invalid email or password",
            });
            return;
        }
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                statusCode: 400,
                message: "Invalid email or password",
            });
            return;
        }
        const token = (0, generateToken_1.generateToken)(user);
        // remove password
        const _a = user.toObject(), { password: _ } = _a, userObject = __rest(_a, ["password"]);
        res.json({
            success: true,
            statusCode: 200,
            message: "User logged in successfully",
            token,
            data: userObject,
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
        return;
    }
});
exports.loginController = loginController;
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield auth_model_1.User.find({}, { password: 0 });
        if (users.length === 0) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "No users found",
            });
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Users retrieved successfully",
            data: users,
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: error.message
        });
        return;
    }
});
exports.getAllUsers = getAllUsers;
const getUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield auth_model_1.User.findById(req.params.id, { password: 0 });
        if (!user) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "User not found",
            });
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "User retrieved successfully",
            data: user,
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: error.message
        });
        return;
    }
});
exports.getUserById = getUserById;
const resetPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, newPassword } = auth_validation_1.resetPasswordValidation.parse(req.body);
        const user = yield auth_model_1.User.findOne({ phone });
        if (!user) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "User not found"
            });
            return;
        }
        user.password = newPassword;
        yield user.save();
        res.json({
            success: true,
            statusCode: 200,
            message: "Password reset successfully"
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
        return;
    }
});
exports.resetPassword = resetPassword;
const activateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone } = auth_validation_1.activateUserValidation.parse(req.body);
        const user = yield auth_model_1.User.findOne({ phone });
        if (!user) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "User not found"
            });
            return;
        }
        user.status = 'active';
        yield user.save();
        res.json({
            success: true,
            statusCode: 200,
            message: "User activated successfully"
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
        return;
    }
});
exports.activateUser = activateUser;
const checkPhoneExists = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone } = auth_validation_1.phoneCheckValidation.parse(req.body);
        const user = yield auth_model_1.User.findOne({ phone });
        if (!user) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "Phone number not found"
            });
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Phone number exists",
            data: {
                exists: true,
                phone: user.phone
            }
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
        return;
    }
});
exports.checkPhoneExists = checkPhoneExists;
const checkEmailExists = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = auth_validation_1.emailCheckValidation.parse(req.body);
        const user = yield auth_model_1.User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "Email not found"
            });
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Email exists",
            data: {
                exists: true,
                email: user.email
            }
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
        return;
    }
});
exports.checkEmailExists = checkEmailExists;
// Google Authentication - verify Firebase token and create/login user
const googleAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idToken } = auth_validation_1.googleAuthValidation.parse(req.body);
        // Verify Firebase ID token
        let decodedToken;
        try {
            decodedToken = yield firebase_admin_1.default.auth().verifyIdToken(idToken);
        }
        catch (firebaseError) {
            res.status(401).json({
                success: false,
                statusCode: 401,
                message: "Invalid or expired Firebase token"
            });
            return;
        }
        const { uid, email, name, picture } = decodedToken;
        if (!email) {
            res.status(400).json({
                success: false,
                statusCode: 400,
                message: "Email not provided by Google"
            });
            return;
        }
        // Check if user already exists with this googleId or email
        let user = yield auth_model_1.User.findOne({
            $or: [
                { googleId: uid },
                { email: email }
            ]
        });
        if (user) {
            // User exists - update Google info if needed
            if (!user.googleId) {
                user.googleId = uid;
                user.authProvider = 'google';
                if (!user.img && picture)
                    user.img = picture;
                yield user.save();
            }
        }
        else {
            // Create new user
            user = new auth_model_1.User({
                name: name || email.split('@')[0],
                email: email,
                googleId: uid,
                img: picture || '',
                authProvider: 'google',
                role: 'user',
                status: 'active'
            });
            yield user.save();
        }
        // Generate JWT token
        const token = (0, generateToken_1.generateToken)(user);
        // Remove password from response
        const _a = user.toObject(), { password: _ } = _a, userObject = __rest(_a, ["password"]);
        res.json({
            success: true,
            statusCode: 200,
            message: "Google authentication successful",
            token,
            data: userObject
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
        return;
    }
});
exports.googleAuth = googleAuth;
// Update Profile - respects auth provider restrictions
const updateProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const { name, phone, email } = req.body;
        // Get current user
        const user = yield auth_model_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "User not found"
            });
            return;
        }
        // Prepare update object based on auth provider
        const updateData = {};
        // Handle name - all users can update
        if (name !== undefined) {
            updateData.name = name;
        }
        // Handle phone - cannot change for phone auth provider (phone is their primary login)
        if (phone !== undefined) {
            // Phone users cannot change their phone (it's their login method)
            if (user.authProvider === 'phone') {
                // Skip phone update for phone login users
            }
            else {
                // Google and local users CAN add/update their phone
                if (phone && phone.length > 0) {
                    const existingPhone = yield auth_model_1.User.findOne({ phone, _id: { $ne: userId } });
                    if (existingPhone) {
                        res.status(400).json({
                            success: false,
                            statusCode: 400,
                            message: "Phone number already exists"
                        });
                        return;
                    }
                }
                updateData.phone = phone || undefined;
            }
        }
        // Handle email - cannot change for google and local auth provider (email is their primary login)
        if (email !== undefined) {
            // Google and local users cannot change their email (it's their login method)
            if (user.authProvider === 'google' || user.authProvider === 'local') {
                // Skip email update for these providers
            }
            else {
                // Phone users CAN add/update their email
                if (email && email.length > 0) {
                    const existingEmail = yield auth_model_1.User.findOne({ email, _id: { $ne: userId } });
                    if (existingEmail) {
                        res.status(400).json({
                            success: false,
                            statusCode: 400,
                            message: "Email already exists"
                        });
                        return;
                    }
                }
                updateData.email = email || undefined;
            }
        }
        // Handle image upload (from multer)
        if (req.file) {
            updateData.img = req.file.path;
        }
        // Update user
        const updatedUser = yield auth_model_1.User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, select: '-password -otp -otpExpires' });
        res.json({
            success: true,
            statusCode: 200,
            message: "Profile updated successfully",
            data: updatedUser
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
        return;
    }
});
exports.updateProfile = updateProfile;
// Change Password - only for local (email/password) users
const changePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const { currentPassword, newPassword } = req.body;
        // Validate input
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                success: false,
                statusCode: 400,
                message: "Current password and new password are required"
            });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({
                success: false,
                statusCode: 400,
                message: "New password must be at least 6 characters"
            });
            return;
        }
        // Get user with password
        const user = yield auth_model_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "User not found"
            });
            return;
        }
        // Check auth provider - only local users can change password
        if (user.authProvider !== 'local') {
            res.status(403).json({
                success: false,
                statusCode: 403,
                message: `Cannot change password for ${user.authProvider} login. Please use ${user.authProvider === 'google' ? 'Google' : 'Phone OTP'} to login.`
            });
            return;
        }
        // Verify current password
        const isMatch = yield user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                statusCode: 401,
                message: "Current password is incorrect"
            });
            return;
        }
        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        yield user.save();
        res.json({
            success: true,
            statusCode: 200,
            message: "Password changed successfully"
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            statusCode: 400,
            message: error.message
        });
        return;
    }
});
exports.changePassword = changePassword;
// Get current user profile
const getProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const user = yield auth_model_1.User.findById(userId, { password: 0, otp: 0, otpExpires: 0 });
        if (!user) {
            res.status(404).json({
                success: false,
                statusCode: 404,
                message: "User not found"
            });
            return;
        }
        res.json({
            success: true,
            statusCode: 200,
            message: "Profile retrieved successfully",
            data: user
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: error.message
        });
        return;
    }
});
exports.getProfile = getProfile;
