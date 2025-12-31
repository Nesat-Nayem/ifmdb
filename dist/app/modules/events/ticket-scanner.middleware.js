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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateScanner = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ticket_scanner_model_1 = require("./ticket-scanner.model");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
/**
 * Middleware to authenticate scanner requests
 * Validates the scanner token and attaches scanner info to request
 */
const authenticateScanner = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Check if it's a scanner token
        if (decoded.type !== 'scanner') {
            return res.status(401).json({
                success: false,
                message: 'Invalid scanner token.',
            });
        }
        // Find scanner and verify token matches
        const scanner = yield ticket_scanner_model_1.TicketScannerAccess.findById(decoded.scannerId);
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
        req.scanner = scanner;
        req.scannerVendorId = decoded.vendorId;
        next();
    }
    catch (error) {
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
});
exports.authenticateScanner = authenticateScanner;
