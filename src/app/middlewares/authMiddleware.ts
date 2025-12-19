import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../modules/auth/auth.model";
// import { Staff } from "../modules/staff/staff.model";
// import { AdminStaff } from "../modules/admin-staff/admin-staff.model";
import { userInterface } from "./userInterface";
import { appError } from "../errors/appError";

export const auth = (...requiredRoles: string[]) => {
  return async (req: userInterface, res: Response, next: NextFunction) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return next(new appError("Authentication required. No token provided", 401));
      }

      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

      // Find user across different collections
      let user: any = await User.findById(decoded.userId) 
                      // await Staff.findById(decoded.userId) || 
                      // await AdminStaff.findById(decoded.userId);

      if (!user) {
        return next(new appError("User not found", 401));
      }

      // Attach user to request
      req.user = user;

      // Role-based authorization
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        return next(new appError("You do not have permission to perform this action", 403));
      }
      
      next();
    } catch (error) {
      next(new appError("Invalid or expired token", 401));
    }
  };
};

// Optional auth - attaches user if token exists, but doesn't fail if missing
// Useful for public endpoints that need to show different data for authenticated users
export const optionalAuth = () => {
  return async (req: userInterface, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      
      if (!token) {
        // No token provided - continue without user
        req.user = undefined;
        return next();
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

      // Find user
      const user: any = await User.findById(decoded.userId);

      if (user) {
        // Attach user to request if found
        req.user = user;
      }
      
      next();
    } catch (error) {
      // Token invalid - continue without user (don't fail)
      req.user = undefined;
      next();
    }
  };
};
