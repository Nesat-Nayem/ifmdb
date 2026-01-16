"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const cloudinary_1 = require("../../config/cloudinary");
const router = express_1.default.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     SignupRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - phone
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User's password
 *         phone:
 *           type: string
 *           description: User's phone number
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT authentication token
 */
/**
 * @swagger
 * /v1/api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/signup", auth_controller_1.singUpController);
/**
 * @swagger
 * /v1/api/auth/signin:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/signin", auth_controller_1.loginController);
/**
 * @swagger
 * /v1/api/auth/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get("/users", auth_controller_1.getAllUsers);
/**
 * @swagger
 * /v1/api/auth/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get("/user/:id", (0, authMiddleware_1.auth)(), auth_controller_1.getUserById);
/**
 * @swagger
 * /v1/api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request
 */
router.post("/reset-password", auth_controller_1.resetPassword);
// /**
//  * @swagger
//  * /v1/api/auth/activate-user:
//  *   post:
//  *     summary: Activate user account
//  *     tags: [Authentication]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *               - activationCode
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 format: email
//  *               activationCode:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: User activated successfully
//  *       400:
//  *         description: Invalid activation code
//  */
router.post("/activate-user", auth_controller_1.activateUser);
// /**
//  * @swagger
//  * /v1/api/auth/check-phone:
//  *   post:
//  *     summary: Check if phone number exists
//  *     tags: [Validation]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - phone
//  *             properties:
//  *               phone:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Phone check result
//  *       400:
//  *         description: Bad request
//  */
router.post("/check-phone", auth_controller_1.checkPhoneExists);
// /**
//  * @swagger
//  * /v1/api/auth/check-email:
//  *   post:
//  *     summary: Check if email exists
//  *     tags: [Validation]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 format: email
//  *     responses:
//  *       200:
//  *         description: Email check result
//  *       400:
//  *         description: Bad request
//  */
router.post("/check-email", auth_controller_1.checkEmailExists);
/**
 * @swagger
 * /v1/api/auth/user/{id}:
 *   patch:
 *     summary: Update user information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.patch("/user/:id", (0, authMiddleware_1.auth)(), auth_controller_1.updateUser);
/**
 * @swagger
 * /v1/api/auth/request-otp:
 *   post:
 *     summary: Request OTP for phone number login
 *     description: |
 *       Send a 6-digit OTP to the provided phone number.
 *       If user doesn't exist, a new user account will be created automatically.
 *       OTP is valid for 5 minutes. Later WhatsApp API will be integrated to send OTP.
 *     tags: [Phone Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *                 description: 10-digit Indian mobile number (without country code)
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     otp:
 *                       type: string
 *                       example: "123456"
 *                       description: 6-digit OTP (shown only in development)
 *                     phone:
 *                       type: string
 *                       example: "9876543210"
 *       400:
 *         description: Invalid phone number format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/request-otp", auth_controller_1.requestOtp);
/**
 * @swagger
 * /v1/api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login with phone number
 *     description: |
 *       Verify the 6-digit OTP sent to phone number.
 *       On successful verification, returns JWT auth token and user data.
 *       OTP expires after 5 minutes.
 *     tags: [Phone Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *                 description: 10-digit Indian mobile number
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit OTP received
 *     responses:
 *       200:
 *         description: OTP verified successfully, user logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 data:
 *                   type: object
 *                   description: User object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     phone:
 *                       type: string
 *                       example: "9876543210"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     authProvider:
 *                       type: string
 *                       example: "phone"
 *                     status:
 *                       type: string
 *                       example: "active"
 *       401:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired OTP"
 *       404:
 *         description: User not found
 */
router.post("/verify-otp", auth_controller_1.verifyOtp);
/**
 * @swagger
 * /v1/api/auth/google:
 *   post:
 *     summary: Login/Register with Google (Firebase)
 *     description: |
 *       Authenticate user using Firebase Google Sign-In.
 *       Frontend should use Firebase SDK to get the ID token after Google popup sign-in.
 *       If user doesn't exist, a new account will be created automatically.
 *       Works with both web (Next.js) and mobile (Flutter) apps.
 *     tags: [Google Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token obtained from Google Sign-In
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *     responses:
 *       200:
 *         description: Google authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Google authentication successful"
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@gmail.com"
 *                     img:
 *                       type: string
 *                       example: "https://lh3.googleusercontent.com/..."
 *                     googleId:
 *                       type: string
 *                       example: "108234567890123456789"
 *                     authProvider:
 *                       type: string
 *                       example: "google"
 *                     role:
 *                       type: string
 *                       example: "user"
 *       401:
 *         description: Invalid or expired Firebase token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired Firebase token"
 *       400:
 *         description: Bad request - Email not provided
 */
router.post("/google", auth_controller_1.googleAuth);
/**
 * @swagger
 * /v1/api/auth/apple:
 *   post:
 *     summary: Login/Register with Apple (Firebase)
 *     description: |
 *       Authenticate user using Apple Sign-In through Firebase.
 *       Frontend should use sign_in_with_apple package and then link with Firebase to get the ID token.
 *       If user doesn't exist, a new account will be created automatically.
 *       Note: Apple only provides name and email on first sign-in.
 *     tags: [Apple Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token obtained from Apple Sign-In
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *               fullName:
 *                 type: object
 *                 properties:
 *                   givenName:
 *                     type: string
 *                     example: "John"
 *                   familyName:
 *                     type: string
 *                     example: "Doe"
 *               email:
 *                 type: string
 *                 example: "john@privaterelay.appleid.com"
 *     responses:
 *       200:
 *         description: Apple authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Apple authentication successful"
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     appleId:
 *                       type: string
 *                     authProvider:
 *                       type: string
 *                       example: "apple"
 *       401:
 *         description: Invalid or expired Firebase token
 *       400:
 *         description: Bad request
 */
router.post("/apple", auth_controller_1.appleAuth);
/**
 * @swagger
 * /v1/api/auth/profile/{id}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve current user profile data
 *     tags: [Profile Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     img:
 *                       type: string
 *                     authProvider:
 *                       type: string
 *                       enum: [local, google, phone]
 *                     role:
 *                       type: string
 *       404:
 *         description: User not found
 */
router.get("/profile/:id", auth_controller_1.getProfile);
/**
 * @swagger
 * /v1/api/auth/profile/{id}:
 *   put:
 *     summary: Update user profile
 *     description: |
 *       Update user profile with restrictions based on auth provider:
 *       - **Phone login users**: Cannot change phone number
 *       - **Google login users**: Cannot change email
 *       - **Email/password users**: Cannot change email
 *       - All users can update: name, profile image
 *     tags: [Profile Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               phone:
 *                 type: string
 *                 description: Phone number (cannot update for phone login users)
 *               email:
 *                 type: string
 *                 description: Email (cannot update for google/local users)
 *               img:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error or duplicate email/phone
 *       404:
 *         description: User not found
 */
router.put("/profile/:id", cloudinary_1.upload.single('img'), auth_controller_1.updateProfile);
/**
 * @swagger
 * /v1/api/auth/change-password/{id}:
 *   post:
 *     summary: Change user password
 *     description: |
 *       Change password for email/password login users only.
 *       Google and Phone login users cannot change password.
 *     tags: [Profile Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *                 example: "oldPassword123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *                 example: "newPassword456"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       401:
 *         description: Current password is incorrect
 *       403:
 *         description: Cannot change password for this auth provider
 *       404:
 *         description: User not found
 */
router.post("/change-password/:id", auth_controller_1.changePassword);
/**
 * @swagger
 * /v1/api/auth/delete-account/{id}:
 *   delete:
 *     summary: Delete user account permanently
 *     description: |
 *       Permanently delete user account and all associated data.
 *       - **Email/password users**: Must provide current password
 *       - **Google/Apple/Phone users**: No password required
 *       - All users must confirm by sending confirmDelete: "DELETE"
 *     tags: [Profile Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirmDelete
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password (required only for email/password users)
 *               confirmDelete:
 *                 type: string
 *                 enum: [DELETE]
 *                 description: Must be exactly "DELETE" to confirm
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Account deleted successfully. We're sorry to see you go."
 *       400:
 *         description: Missing confirmation or password
 *       401:
 *         description: Incorrect password
 *       404:
 *         description: User not found
 */
router.delete("/delete-account/:id", auth_controller_1.deleteAccount);
exports.authRouter = router;
