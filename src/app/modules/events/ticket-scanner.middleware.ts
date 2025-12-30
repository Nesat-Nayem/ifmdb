import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TicketScannerAccess } from './ticket-scanner.model';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware to authenticate scanner requests
 * Validates the scanner token and attaches scanner info to request
 */
export const authenticateScanner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Scanner authentication token required.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      scannerId: string;
      vendorId: string;
      type: string;
    };

    // Check if it's a scanner token
    if (decoded.type !== 'scanner') {
      return res.status(401).json({
        success: false,
        message: 'Invalid scanner token.',
      });
    }

    // Find scanner and verify token matches
    const scanner = await TicketScannerAccess.findById(decoded.scannerId);

    if (!scanner) {
      return res.status(401).json({
        success: false,
        message: 'Scanner account not found.',
      });
    }

    if (!scanner.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Scanner account has been deactivated.',
      });
    }

    // Verify the token matches the stored token
    if (scanner.scannerToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
      });
    }

    // Check token expiry
    if (scanner.tokenExpiresAt && new Date() > scanner.tokenExpiresAt) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
      });
    }

    // Attach scanner to request
    (req as any).scanner = scanner;
    (req as any).scannerVendorId = decoded.vendorId;

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid scanner token.',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Scanner token expired. Please login again.',
      });
    }

    console.error('Scanner auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};
