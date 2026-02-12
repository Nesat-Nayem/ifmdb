import { Request, Response } from "express";
import { User } from "./auth.model";
import { RequestHandler } from 'express';
import { activateUserValidation, authValidation, emailCheckValidation, googleAuthValidation, appleAuthValidation, loginValidation, phoneCheckValidation, requestOtpValidation, resetPasswordValidation, updateUserValidation, verifyOtpValidation } from "./auth.validation";
import { generateToken } from "../../config/generateToken";
import admin from "firebase-admin";
// import { AdminStaff } from "../admin-staff/admin-staff.model";

// Helper function to parse MongoDB duplicate key errors into user-friendly messages
const parseDuplicateKeyError = (error: any): string => {
  // Check if it's a MongoDB duplicate key error (code 11000)
  if (error.code === 11000 || error.message?.includes('E11000')) {
    const keyPattern = error.keyPattern || {};
    
    // Determine which field caused the duplicate
    if (keyPattern.email || error.message?.includes('email')) {
      return 'An account with this email already exists. Please use a different email or try logging in.';
    }
    if (keyPattern.googleId || error.message?.includes('googleId')) {
      return 'This Google account is already linked to another user.';
    }
    if (keyPattern.appleId || error.message?.includes('appleId')) {
      return 'This Apple account is already linked to another user.';
    }
    
    // Generic duplicate error
    return 'An account with these details already exists. Please try logging in instead.';
  }
  
  // Return original message for non-duplicate errors
  return error.message || 'An unexpected error occurred';
};

export const singUpController: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { name, password, img, phone, email, role } = authValidation.parse(req.body);

    // Check for existing email (only email should be unique)
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Email already exists",
      });
      return;
    }

    const user = new User({ name, password, img, phone, email, role, authProvider: 'local' });
    await user.save();

    const { password: _, ...userObject } = user.toObject();

    res.status(201).json({
      success: true,
      statusCode: 200,
      message: "User registered successfully",
      data: userObject,
    });
    return;
  } catch (error: any) {
    const userFriendlyMessage = parseDuplicateKeyError(error);
    res.status(400).json({ 
      success: false, 
      statusCode: 400, 
      message: userFriendlyMessage 
    });
  }
};


// Add these functions to your existing controller file

// Utility function to generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP handler - sends OTP via WhatsApp
export const requestOtp: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { phone } = requestOtpValidation.parse(req.body);

    // Find or create user
    let user = await User.findOne({ phone });
    
    if (!user) {
      user = new User({
        phone,
        role: 'user',
        status: 'active',
        authProvider: 'phone'
      });
    } else if (!user.authProvider) {
      user.authProvider = 'phone';
    }

    // Generate OTP and set expiration (5 minutes)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    user.otp = otp;
    user.otpExpires = expiresAt;
    
    await user.save();

    // Log OTP to console for development
    console.log(`📱 WhatsApp OTP for ${phone}: ${otp}`);
    console.log(`OTP expires at: ${expiresAt.toLocaleString()}`);

    // Send OTP via WhatsApp API (international)
    let whatsappSent = false;
    try {
      const whatsappApiUrl = `https://wapi.nationalsms.in/wapp/v2/api/send?apikey=274d09e223464ff89c9ba70a7b68434e&mobile=${phone}&msg=Your MovieMart login OTP is ${otp}. Valid for 5 minutes. Do not share this code with anyone.&intl=true`;
      const response = await fetch(whatsappApiUrl);
      const result = await response.text();
      console.log(`WhatsApp API Response: ${result}`);
      whatsappSent = true;
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp OTP:', whatsappError);
      // Continue with the flow even if WhatsApp fails, for development purposes
    }
    
    res.json({
      success: true,
      statusCode: 200,
      message: whatsappSent 
        ? "OTP sent successfully to your WhatsApp" 
        : "OTP generated successfully",
      data: { 
        otp, // Include OTP in response for development/testing - remove in production
        phone,
        expiresIn: 300, // 300 seconds = 5 minutes
        whatsappSent
      }
    });
    return;
  } catch (error: any) {
    const userFriendlyMessage = parseDuplicateKeyError(error);
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: userFriendlyMessage
    });
  }
};


// Verify OTP and login
export const verifyOtp: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { phone, otp } = verifyOtpValidation.parse(req.body);
    
    // Find user by phone
    const user = await User.findOne({ phone });
    
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
    const token = generateToken(user);
    
    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    // Remove password from response
    const { password: _, ...userObject } = user.toObject();
    
    res.json({
      success: true,
      statusCode: 200,
      message: "OTP verified successfully",
      token,
      data: userObject
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message
    });
  }
};


export const updateUser: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    // Create a clean request body by filtering out undefined/null values
    const cleanBody = Object.fromEntries(
      Object.entries(req.body).filter(([_, v]) => v !== undefined && v !== null)
    );
    
    // Validate the clean data
    const validatedData = updateUserValidation.parse(cleanBody);
    
    // Check if email is being updated with a non-empty value and if it already exists
    if (validatedData.email && validatedData.email.length > 0) {
      const existingUser = await User.findOne({
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

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, select: '-password' }
    );

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
  } catch (error: any) {
    const userFriendlyMessage = parseDuplicateKeyError(error);
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: userFriendlyMessage
    });
  }
};


export const loginController: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { email, password } = loginValidation.parse(req.body);

    // First try to find in User model
    let user = await User.findOne({ email });
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

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        statusCode: 400,
        message: "Invalid email or password",
      });
      return;
    }



    const token = generateToken(user);

    // remove password
    const { password: _, ...userObject } = user.toObject();

    res.json({
      success: true,
      statusCode: 200,
      message: "User logged in successfully",
      token,
      data: userObject,
    });
    return;
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      statusCode: 400, 
      message: error.message 
    });
    return;
  }
};

export const getAllUsers: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const users = await User.find({}, { password: 0 });
    
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
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      statusCode: 500, 
      message: error.message 
    });
    return;
  }
};

export const getUserById: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const user = await User.findById(req.params.id, { password: 0 });
    
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
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      statusCode: 500, 
      message: error.message 
    });
    return;
  }
};

export const resetPassword: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { phone, newPassword } = resetPasswordValidation.parse(req.body);
    
    const user = await User.findOne({ phone });
    if (!user) {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found"
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      statusCode: 200,
      message: "Password reset successfully"
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message
    });
    return;
  }
};

export const activateUser: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { phone } = activateUserValidation.parse(req.body);
    
    const user = await User.findOne({ phone });
    if (!user) {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found"
      });
      return;
    }

    (user as any).status = 'active';
    await user.save();

    res.json({
      success: true,
      statusCode: 200,
      message: "User activated successfully"
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message
    });
    return;
  }
};

export const checkPhoneExists: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { phone } = phoneCheckValidation.parse(req.body);
    
    const user = await User.findOne({ phone });
    
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
  } catch (error: any) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message
    });
    return;
  }
};

export const checkEmailExists: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { email } = emailCheckValidation.parse(req.body);
    
    const user = await User.findOne({ email });
    
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
  } catch (error: any) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message
    });
    return;
  }
};

// Google Authentication - verify Firebase token and create/login user
export const googleAuth: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { idToken } = googleAuthValidation.parse(req.body);

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (firebaseError: any) {
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
    let user = await User.findOne({ 
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
        if (!user.img && picture) user.img = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        name: name || email.split('@')[0],
        email: email,
        googleId: uid,
        img: picture || '',
        authProvider: 'google',
        role: 'user',
        status: 'active'
      });
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userObject } = user.toObject();

    res.json({
      success: true,
      statusCode: 200,
      message: "Google authentication successful",
      token,
      data: userObject
    });
    return;
  } catch (error: any) {
    const userFriendlyMessage = parseDuplicateKeyError(error);
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: userFriendlyMessage
    });
    return;
  }
};

// Update Profile - respects auth provider restrictions
export const updateProfile: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const userId = req.params.id;
    const { name, phone, email } = req.body;
    
    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found"
      });
      return;
    }

    // Prepare update object based on auth provider
    const updateData: any = {};

    // Handle name - all users can update
    if (name !== undefined) {
      updateData.name = name;
    }

    // Handle phone - cannot change for phone auth provider (phone is their primary login)
    if (phone !== undefined) {
      // Phone users cannot change their phone (it's their login method)
      if (user.authProvider === 'phone') {
        // Skip phone update for phone login users
      } else {
        // Google and local users CAN add/update their phone
        if (phone && phone.length > 0) {
          const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
          if (existingPhone) {
            res.status(400).json({
              success: false,
              statusCode: 400,
              message: "This phone number is already registered with another account"
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
      } else {
        // Phone users CAN add/update their email
        if (email && email.length > 0) {
          const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
          if (existingEmail) {
            res.status(400).json({
              success: false,
              statusCode: 400,
              message: "This email is already registered with another account"
            });
            return;
          }
        }
        updateData.email = email || undefined;
      }
    }

    // Handle image upload (from multer)
    if (req.file) {
      updateData.img = (req.file as any).path;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: '-password -otp -otpExpires' }
    );

    res.json({
      success: true,
      statusCode: 200,
      message: "Profile updated successfully",
      data: updatedUser
    });
    return;
  } catch (error: any) {
    const userFriendlyMessage = parseDuplicateKeyError(error);
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: userFriendlyMessage
    });
    return;
  }
};

// Change Password - only for local (email/password) users
export const changePassword: RequestHandler = async (req, res, next): Promise<void> => {
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
    const user = await User.findById(userId);
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
    const isMatch = await user.comparePassword(currentPassword);
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
    await user.save();

    res.json({
      success: true,
      statusCode: 200,
      message: "Password changed successfully"
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message
    });
    return;
  }
};

// Get current user profile
export const getProfile: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId, { password: 0, otp: 0, otpExpires: 0 });
    
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message
    });
    return;
  }
};

// Delete Account - permanently delete user account and all associated data
export const deleteAccount: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const userId = req.params.id;
    const { password, confirmDelete } = req.body;

    // Validate confirmation
    if (confirmDelete !== 'DELETE') {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Please type 'DELETE' to confirm account deletion"
      });
      return;
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found"
      });
      return;
    }

    // For local (email/password) users, verify password
    if (user.authProvider === 'local') {
      if (!password) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Password is required to delete account"
        });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          statusCode: 401,
          message: "Incorrect password"
        });
        return;
      }
    }

    // Delete the user account
    await User.findByIdAndDelete(userId);

    // TODO: Add cleanup for related data (bookings, watchlist, etc.) if needed
    // await Booking.deleteMany({ userId });
    // await Watchlist.deleteMany({ userId });

    console.log(`🗑️ Account deleted: ${userId} (${user.email || user.phone})`);

    res.json({
      success: true,
      statusCode: 200,
      message: "Account deleted successfully. We're sorry to see you go."
    });
    return;
  } catch (error: any) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to delete account. Please try again later."
    });
    return;
  }
};

// Apple Authentication - verify Apple identity token directly and create/login user
export const appleAuth: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    console.log("🍎 [Apple Auth] Request received");
    console.log("🍎 [Apple Auth] Body keys:", Object.keys(req.body));
    
    const { idToken, userIdentifier, fullName, email: providedEmail } = appleAuthValidation.parse(req.body);

    console.log("🍎 [Apple Auth] Validation passed");
    console.log("🍎 [Apple Auth] idToken length:", idToken?.length);
    console.log("🍎 [Apple Auth] userIdentifier:", userIdentifier);
    console.log("🍎 [Apple Auth] providedEmail:", providedEmail);
    console.log("🍎 [Apple Auth] fullName:", fullName);

    // Decode Apple's identity token (JWT) without verification for now
    // The token is signed by Apple and contains user info
    let decodedPayload: any;
    try {
      // Apple's identity token is a JWT - decode the payload
      const tokenParts = idToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error("Invalid Apple identity token format");
      }
      
      // Decode the payload (middle part)
      const payload = tokenParts[1];
      const decodedString = Buffer.from(payload, 'base64').toString('utf8');
      decodedPayload = JSON.parse(decodedString);
      
      console.log("🍎 [Apple Auth] Decoded token payload:");
      console.log("🍎 [Apple Auth] - iss:", decodedPayload.iss);
      console.log("🍎 [Apple Auth] - sub:", decodedPayload.sub);
      console.log("🍎 [Apple Auth] - aud:", decodedPayload.aud);
      console.log("🍎 [Apple Auth] - email:", decodedPayload.email);
      console.log("🍎 [Apple Auth] - email_verified:", decodedPayload.email_verified);
      
      // Verify issuer is Apple
      if (decodedPayload.iss !== 'https://appleid.apple.com') {
        throw new Error("Invalid token issuer");
      }
      
      // Verify token is not expired
      const now = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp && decodedPayload.exp < now) {
        throw new Error("Apple identity token has expired");
      }
      
    } catch (decodeError: any) {
      console.log("❌ [Apple Auth] Token decode error:", decodeError.message);
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Invalid Apple identity token: " + decodeError.message
      });
      return;
    }

    // Extract user info from decoded token
    // 'sub' is the unique Apple user ID (stable across sign-ins)
    const appleUserId = decodedPayload.sub || userIdentifier;
    const tokenEmail = decodedPayload.email;
    
    // Use email from token or provided email
    const email = tokenEmail || providedEmail;
    
    console.log("🍎 [Apple Auth] Apple User ID:", appleUserId);
    console.log("🍎 [Apple Auth] Final email:", email);
    
    // Build name from fullName if provided (Apple only sends name on first sign-in)
    let name = '';
    if (fullName) {
      const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
      name = parts.join(' ');
    }
    console.log("🍎 [Apple Auth] Constructed name:", name);

    // Check if user already exists with this appleId or email
    let user = await User.findOne({ 
      $or: [
        { appleId: appleUserId },
        ...(email ? [{ email: email }] : [])
      ]
    });

    console.log("🍎 [Apple Auth] Existing user found:", !!user);

    if (user) {
      // User exists - update Apple info if needed
      if (!user.appleId) {
        user.appleId = appleUserId;
        user.authProvider = 'apple';
        await user.save();
        console.log("🍎 [Apple Auth] Updated existing user with Apple ID");
      }
      // Update name if we have it and user doesn't have one
      if (name && !user.name) {
        user.name = name;
        await user.save();
        console.log("🍎 [Apple Auth] Updated user name");
      }
    } else {
      // Create new user
      console.log("🍎 [Apple Auth] Creating new user...");
      user = new User({
        name: name || (email ? email.split('@')[0] : `Apple User ${appleUserId.substring(0, 6)}`),
        email: email || undefined,
        appleId: appleUserId,
        authProvider: 'apple',
        role: 'user',
        status: 'active'
      });
      await user.save();
      console.log("🍎 [Apple Auth] New user created with ID:", user._id);
    }

    // Generate JWT token
    const token = generateToken(user);
    console.log("🍎 [Apple Auth] JWT token generated");

    // Remove password from response
    const { password: _, ...userObject } = user.toObject();

    console.log("✅ [Apple Auth] Authentication successful for user:", user._id);
    
    res.json({
      success: true,
      statusCode: 200,
      message: "Apple authentication successful",
      token,
      data: userObject
    });
    return;
  } catch (error: any) {
    console.log("❌ [Apple Auth] Error:", error.message);
    const userFriendlyMessage = parseDuplicateKeyError(error);
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: userFriendlyMessage
    });
    return;
  }
};
