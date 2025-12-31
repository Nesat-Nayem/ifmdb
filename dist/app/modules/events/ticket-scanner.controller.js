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
exports.getVendorScanLogs = exports.getScanStats = exports.getScanHistory = exports.validateTicket = exports.scannerLogout = exports.scannerLogin = exports.toggleScannerStatus = exports.deleteScannerAccess = exports.updateScannerAccess = exports.getScannerAccessById = exports.getVendorScannerAccounts = exports.createScannerAccess = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ticket_scanner_model_1 = require("./ticket-scanner.model");
const event_booking_model_1 = require("./event-booking.model");
const events_model_1 = __importDefault(require("./events.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SCANNER_TOKEN_EXPIRY = '24h';
// ============ SCANNER ACCESS CRUD (Vendor Management) ============
/**
 * Create a new scanner access account
 * Only vendors can create scanner access for their events
 */
const createScannerAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const vendorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { name, email, password, phone, allowedEvents, notes } = req.body;
        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Vendor authentication required.',
            });
        }
        // Check if email already exists
        const existingScanner = yield ticket_scanner_model_1.TicketScannerAccess.findOne({ email: email.toLowerCase() });
        if (existingScanner) {
            return res.status(400).json({
                success: false,
                message: 'A scanner account with this email already exists.',
            });
        }
        // Validate allowed events belong to this vendor
        if (allowedEvents && allowedEvents.length > 0) {
            const events = yield events_model_1.default.find({
                _id: { $in: allowedEvents },
                createdBy: vendorId,
            });
            if (events.length !== allowedEvents.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some events do not belong to you or do not exist.',
                });
            }
        }
        const scannerAccess = new ticket_scanner_model_1.TicketScannerAccess({
            vendorId,
            name,
            email: email.toLowerCase(),
            password,
            phone: phone || '',
            allowedEvents: allowedEvents || [],
            notes: notes || '',
            isActive: true,
        });
        yield scannerAccess.save();
        // Remove password from response
        const response = scannerAccess.toObject();
        delete response.password;
        return res.status(201).json({
            success: true,
            message: 'Scanner access created successfully.',
            data: response,
        });
    }
    catch (error) {
        console.error('Create scanner access error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create scanner access.',
        });
    }
});
exports.createScannerAccess = createScannerAccess;
/**
 * Get all scanner access accounts for a vendor
 */
const getVendorScannerAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const vendorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { page = 1, limit = 10, isActive, search } = req.query;
        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized.',
            });
        }
        const query = { vendorId };
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [scanners, total] = yield Promise.all([
            ticket_scanner_model_1.TicketScannerAccess.find(query)
                .select('-password -scannerToken')
                .populate('allowedEvents', 'title startDate')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            ticket_scanner_model_1.TicketScannerAccess.countDocuments(query),
        ]);
        return res.status(200).json({
            success: true,
            data: scanners,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get scanner accounts error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get scanner accounts.',
        });
    }
});
exports.getVendorScannerAccounts = getVendorScannerAccounts;
/**
 * Get single scanner access by ID
 */
const getScannerAccessById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const vendorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { id } = req.params;
        const scanner = yield ticket_scanner_model_1.TicketScannerAccess.findOne({
            _id: id,
            vendorId,
        })
            .select('-password -scannerToken')
            .populate('allowedEvents', 'title startDate location');
        if (!scanner) {
            return res.status(404).json({
                success: false,
                message: 'Scanner access not found.',
            });
        }
        return res.status(200).json({
            success: true,
            data: scanner,
        });
    }
    catch (error) {
        console.error('Get scanner access error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get scanner access.',
        });
    }
});
exports.getScannerAccessById = getScannerAccessById;
/**
 * Update scanner access
 */
const updateScannerAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const vendorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { id } = req.params;
        const { name, phone, allowedEvents, notes, isActive, password } = req.body;
        const scanner = yield ticket_scanner_model_1.TicketScannerAccess.findOne({ _id: id, vendorId });
        if (!scanner) {
            return res.status(404).json({
                success: false,
                message: 'Scanner access not found.',
            });
        }
        // Validate allowed events if provided
        if (allowedEvents && allowedEvents.length > 0) {
            const events = yield events_model_1.default.find({
                _id: { $in: allowedEvents },
                createdBy: vendorId,
            });
            if (events.length !== allowedEvents.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some events do not belong to you or do not exist.',
                });
            }
        }
        // Update fields
        if (name !== undefined)
            scanner.name = name;
        if (phone !== undefined)
            scanner.phone = phone;
        if (allowedEvents !== undefined)
            scanner.allowedEvents = allowedEvents;
        if (notes !== undefined)
            scanner.notes = notes;
        if (isActive !== undefined)
            scanner.isActive = isActive;
        if (password)
            scanner.password = password; // Will be hashed by pre-save hook
        yield scanner.save();
        const response = scanner.toObject();
        delete response.password;
        delete response.scannerToken;
        return res.status(200).json({
            success: true,
            message: 'Scanner access updated successfully.',
            data: response,
        });
    }
    catch (error) {
        console.error('Update scanner access error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update scanner access.',
        });
    }
});
exports.updateScannerAccess = updateScannerAccess;
/**
 * Delete scanner access
 */
const deleteScannerAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const vendorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { id } = req.params;
        const scanner = yield ticket_scanner_model_1.TicketScannerAccess.findOneAndDelete({ _id: id, vendorId });
        if (!scanner) {
            return res.status(404).json({
                success: false,
                message: 'Scanner access not found.',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Scanner access deleted successfully.',
        });
    }
    catch (error) {
        console.error('Delete scanner access error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete scanner access.',
        });
    }
});
exports.deleteScannerAccess = deleteScannerAccess;
/**
 * Toggle scanner access status (activate/deactivate)
 */
const toggleScannerStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const vendorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { id } = req.params;
        const scanner = yield ticket_scanner_model_1.TicketScannerAccess.findOne({ _id: id, vendorId });
        if (!scanner) {
            return res.status(404).json({
                success: false,
                message: 'Scanner access not found.',
            });
        }
        scanner.isActive = !scanner.isActive;
        // If deactivating, clear the token
        if (!scanner.isActive) {
            scanner.scannerToken = '';
            scanner.tokenExpiresAt = undefined;
        }
        yield scanner.save();
        return res.status(200).json({
            success: true,
            message: `Scanner access ${scanner.isActive ? 'activated' : 'deactivated'} successfully.`,
            data: { isActive: scanner.isActive },
        });
    }
    catch (error) {
        console.error('Toggle scanner status error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to toggle scanner status.',
        });
    }
});
exports.toggleScannerStatus = toggleScannerStatus;
// ============ SCANNER LOGIN & AUTHENTICATION ============
/**
 * Scanner login - For Flutter app scanner login
 */
const scannerLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, deviceInfo } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.',
            });
        }
        const scanner = yield ticket_scanner_model_1.TicketScannerAccess.findOne({
            email: email.toLowerCase()
        }).populate('vendorId', 'name email');
        if (!scanner) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.',
            });
        }
        if (!scanner.isActive) {
            return res.status(403).json({
                success: false,
                message: 'This scanner account has been deactivated. Please contact the vendor.',
            });
        }
        const isMatch = yield scanner.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.',
            });
        }
        // Generate scanner token
        const token = jsonwebtoken_1.default.sign({
            scannerId: scanner._id,
            vendorId: scanner.vendorId,
            type: 'scanner',
        }, JWT_SECRET, { expiresIn: SCANNER_TOKEN_EXPIRY });
        // Update scanner record
        scanner.scannerToken = token;
        scanner.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        scanner.lastLoginAt = new Date();
        scanner.deviceInfo = deviceInfo || '';
        yield scanner.save();
        // Get allowed events with details
        let allowedEventsData = [];
        if (scanner.allowedEvents.length > 0) {
            allowedEventsData = yield events_model_1.default.find({
                _id: { $in: scanner.allowedEvents },
            }).select('title startDate endDate location posterImage');
        }
        else {
            // If no specific events, get all vendor's active events
            allowedEventsData = yield events_model_1.default.find({
                createdBy: scanner.vendorId,
                status: 'published',
            }).select('title startDate endDate location posterImage');
        }
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            data: {
                _id: scanner._id,
                name: scanner.name,
                email: scanner.email,
                vendorId: scanner.vendorId,
                totalScans: scanner.totalScans,
                allowedEvents: allowedEventsData,
                accountType: 'scanner',
            },
        });
    }
    catch (error) {
        console.error('Scanner login error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Login failed.',
        });
    }
});
exports.scannerLogin = scannerLogin;
/**
 * Scanner logout
 */
const scannerLogout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const scannerId = (_a = req.scanner) === null || _a === void 0 ? void 0 : _a._id;
        if (scannerId) {
            yield ticket_scanner_model_1.TicketScannerAccess.findByIdAndUpdate(scannerId, {
                scannerToken: '',
                tokenExpiresAt: null,
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.',
        });
    }
    catch (error) {
        console.error('Scanner logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Logout failed.',
        });
    }
});
exports.scannerLogout = scannerLogout;
// ============ TICKET VALIDATION ============
/**
 * Validate a ticket by scanning barcode/QR code
 * The barcode contains the bookingReference (e.g., EBKMJMS5WSZY069LI)
 */
const validateTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const scanner = req.scanner;
        const { bookingReference, deviceInfo, location } = req.body;
        if (!scanner) {
            return res.status(401).json({
                success: false,
                message: 'Scanner authentication required.',
            });
        }
        if (!bookingReference) {
            return res.status(400).json({
                success: false,
                message: 'Booking reference is required.',
            });
        }
        // Find the ticket by booking reference (ticketScannerId in EventETicket)
        const ticket = yield event_booking_model_1.EventETicket.findOne({
            $or: [
                { ticketScannerId: bookingReference },
                { ticketNumber: bookingReference },
            ],
        }).populate({
            path: 'bookingId',
            populate: [
                { path: 'eventId', select: 'title startDate endDate location createdBy posterImage' },
                { path: 'userId', select: 'name email phone' },
            ],
        });
        // Create scan log entry
        const createScanLog = (result, message, ticketDetails, eventId) => __awaiter(void 0, void 0, void 0, function* () {
            const scanLog = new ticket_scanner_model_1.TicketScanLog({
                scannerId: scanner._id,
                ticketId: ticket === null || ticket === void 0 ? void 0 : ticket._id,
                bookingReference,
                eventId,
                scanResult: result,
                scanMessage: message,
                ticketDetails,
                location: location || {},
                deviceInfo: deviceInfo || '',
            });
            yield scanLog.save();
            // Update scanner stats
            scanner.lastScanAt = new Date();
            scanner.totalScans += 1;
            yield scanner.save();
        });
        // Ticket not found
        if (!ticket) {
            yield createScanLog('not_found', 'Ticket not found in the system.');
            return res.status(404).json({
                success: false,
                scanResult: 'not_found',
                message: 'Ticket not found. Please check the booking reference.',
            });
        }
        const booking = ticket.bookingId;
        const event = booking === null || booking === void 0 ? void 0 : booking.eventId;
        const customer = booking === null || booking === void 0 ? void 0 : booking.userId;
        // Check if this scanner is allowed to scan this event's tickets
        const eventCreatorId = (_a = event === null || event === void 0 ? void 0 : event.createdBy) === null || _a === void 0 ? void 0 : _a.toString();
        const scannerVendorId = scanner.vendorId.toString();
        // Verify the event belongs to scanner's vendor
        if (eventCreatorId !== scannerVendorId) {
            yield createScanLog('wrong_event', 'This ticket belongs to a different vendor.', {
                eventName: event === null || event === void 0 ? void 0 : event.title,
            }, event === null || event === void 0 ? void 0 : event._id);
            return res.status(403).json({
                success: false,
                scanResult: 'wrong_event',
                message: 'You are not authorized to scan tickets for this event.',
            });
        }
        // If scanner has specific allowed events, check if this event is in the list
        if (scanner.allowedEvents.length > 0) {
            const isAllowed = scanner.allowedEvents.some((allowedId) => { var _a; return allowedId.toString() === ((_a = event === null || event === void 0 ? void 0 : event._id) === null || _a === void 0 ? void 0 : _a.toString()); });
            if (!isAllowed) {
                yield createScanLog('wrong_event', 'Scanner not authorized for this specific event.', {
                    eventName: event === null || event === void 0 ? void 0 : event.title,
                }, event === null || event === void 0 ? void 0 : event._id);
                return res.status(403).json({
                    success: false,
                    scanResult: 'wrong_event',
                    message: 'You are not authorized to scan tickets for this specific event.',
                });
            }
        }
        // Check booking status
        if ((booking === null || booking === void 0 ? void 0 : booking.bookingStatus) !== 'confirmed') {
            yield createScanLog('invalid', `Booking status is ${booking === null || booking === void 0 ? void 0 : booking.bookingStatus}`, {
                customerName: customer === null || customer === void 0 ? void 0 : customer.name,
                eventName: event === null || event === void 0 ? void 0 : event.title,
            }, event === null || event === void 0 ? void 0 : event._id);
            return res.status(400).json({
                success: false,
                scanResult: 'invalid',
                message: `This booking is ${booking === null || booking === void 0 ? void 0 : booking.bookingStatus}. Entry not allowed.`,
            });
        }
        // Check if ticket is already used
        if (ticket.isUsed) {
            yield createScanLog('already_used', `Ticket was already used at ${ticket.usedAt}`, {
                customerName: customer === null || customer === void 0 ? void 0 : customer.name,
                eventName: event === null || event === void 0 ? void 0 : event.title,
                eventDate: event === null || event === void 0 ? void 0 : event.startDate,
            }, event === null || event === void 0 ? void 0 : event._id);
            return res.status(400).json({
                success: false,
                scanResult: 'already_used',
                message: 'This ticket has already been used.',
                usedAt: ticket.usedAt,
                ticketDetails: {
                    customerName: customer === null || customer === void 0 ? void 0 : customer.name,
                    eventName: event === null || event === void 0 ? void 0 : event.title,
                    quantity: ticket.quantity,
                },
            });
        }
        // Check event date (optional - allow entry on event day)
        const eventStartDate = new Date(event === null || event === void 0 ? void 0 : event.startDate);
        const eventEndDate = (event === null || event === void 0 ? void 0 : event.endDate) ? new Date(event.endDate) : eventStartDate;
        const now = new Date();
        // Allow entry from event start date minus 2 hours to event end date plus 4 hours
        const entryStartTime = new Date(eventStartDate.getTime() - 2 * 60 * 60 * 1000);
        const entryEndTime = new Date(eventEndDate.getTime() + 4 * 60 * 60 * 1000);
        if (now < entryStartTime || now > entryEndTime) {
            // Just warn but still allow (vendor decision)
            console.log(`Ticket scanned outside event time window for event: ${event === null || event === void 0 ? void 0 : event.title}`);
        }
        // ✅ VALID TICKET - Mark as used
        ticket.isUsed = true;
        ticket.usedAt = new Date();
        ticket.scannedBy = scanner._id;
        ticket.scanLocation = (location === null || location === void 0 ? void 0 : location.address) || '';
        yield ticket.save();
        const ticketDetails = {
            customerName: customer === null || customer === void 0 ? void 0 : customer.name,
            customerEmail: customer === null || customer === void 0 ? void 0 : customer.email,
            customerPhone: customer === null || customer === void 0 ? void 0 : customer.phone,
            ticketType: booking === null || booking === void 0 ? void 0 : booking.seatType,
            quantity: ticket.quantity,
            eventName: event === null || event === void 0 ? void 0 : event.title,
            eventDate: event === null || event === void 0 ? void 0 : event.startDate,
            eventLocation: event === null || event === void 0 ? void 0 : event.location,
        };
        yield createScanLog('valid', 'Ticket validated successfully.', ticketDetails, event === null || event === void 0 ? void 0 : event._id);
        return res.status(200).json({
            success: true,
            scanResult: 'valid',
            message: 'Ticket validated successfully! Entry allowed.',
            data: {
                ticketNumber: ticket.ticketNumber,
                bookingReference: booking === null || booking === void 0 ? void 0 : booking.bookingReference,
                customer: {
                    name: customer === null || customer === void 0 ? void 0 : customer.name,
                    email: customer === null || customer === void 0 ? void 0 : customer.email,
                    phone: customer === null || customer === void 0 ? void 0 : customer.phone,
                },
                event: {
                    title: event === null || event === void 0 ? void 0 : event.title,
                    date: event === null || event === void 0 ? void 0 : event.startDate,
                    location: event === null || event === void 0 ? void 0 : event.location,
                    posterImage: event === null || event === void 0 ? void 0 : event.posterImage,
                },
                ticket: {
                    type: booking === null || booking === void 0 ? void 0 : booking.seatType,
                    quantity: ticket.quantity,
                    amount: booking === null || booking === void 0 ? void 0 : booking.finalAmount,
                },
                validatedAt: ticket.usedAt,
            },
        });
    }
    catch (error) {
        console.error('Validate ticket error:', error);
        return res.status(500).json({
            success: false,
            scanResult: 'error',
            message: error.message || 'Failed to validate ticket.',
        });
    }
});
exports.validateTicket = validateTicket;
/**
 * Get scan history for a scanner
 */
const getScanHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const scanner = req.scanner;
        const { page = 1, limit = 20, eventId, scanResult } = req.query;
        if (!scanner) {
            return res.status(401).json({
                success: false,
                message: 'Scanner authentication required.',
            });
        }
        const query = { scannerId: scanner._id };
        if (eventId) {
            query.eventId = eventId;
        }
        if (scanResult) {
            query.scanResult = scanResult;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [logs, total] = yield Promise.all([
            ticket_scanner_model_1.TicketScanLog.find(query)
                .populate('eventId', 'title')
                .sort({ scannedAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            ticket_scanner_model_1.TicketScanLog.countDocuments(query),
        ]);
        return res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get scan history error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get scan history.',
        });
    }
});
exports.getScanHistory = getScanHistory;
/**
 * Get scan statistics for a scanner
 */
const getScanStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const scanner = req.scanner;
        const { eventId } = req.query;
        if (!scanner) {
            return res.status(401).json({
                success: false,
                message: 'Scanner authentication required.',
            });
        }
        const matchQuery = { scannerId: scanner._id };
        if (eventId) {
            matchQuery.eventId = new mongoose_1.default.Types.ObjectId(eventId);
        }
        const stats = yield ticket_scanner_model_1.TicketScanLog.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$scanResult',
                    count: { $sum: 1 },
                },
            },
        ]);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStats = yield ticket_scanner_model_1.TicketScanLog.aggregate([
            {
                $match: Object.assign(Object.assign({}, matchQuery), { scannedAt: { $gte: todayStart } }),
            },
            {
                $group: {
                    _id: '$scanResult',
                    count: { $sum: 1 },
                },
            },
        ]);
        const formatStats = (statsArray) => {
            const result = {
                valid: 0,
                invalid: 0,
                already_used: 0,
                not_found: 0,
                wrong_event: 0,
                expired: 0,
                total: 0,
            };
            statsArray.forEach((stat) => {
                result[stat._id] = stat.count;
                result.total += stat.count;
            });
            return result;
        };
        return res.status(200).json({
            success: true,
            data: {
                allTime: formatStats(stats),
                today: formatStats(todayStats),
                scanner: {
                    name: scanner.name,
                    totalScans: scanner.totalScans,
                    lastScanAt: scanner.lastScanAt,
                },
            },
        });
    }
    catch (error) {
        console.error('Get scan stats error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get scan statistics.',
        });
    }
});
exports.getScanStats = getScanStats;
/**
 * Get vendor's scan logs (for admin panel)
 */
const getVendorScanLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const vendorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { page = 1, limit = 20, scannerId, eventId, scanResult } = req.query;
        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized.',
            });
        }
        // Get all scanner IDs for this vendor
        const scannerIds = yield ticket_scanner_model_1.TicketScannerAccess.find({ vendorId }).distinct('_id');
        const query = { scannerId: { $in: scannerIds } };
        if (scannerId) {
            query.scannerId = scannerId;
        }
        if (eventId) {
            query.eventId = eventId;
        }
        if (scanResult) {
            query.scanResult = scanResult;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [logs, total] = yield Promise.all([
            ticket_scanner_model_1.TicketScanLog.find(query)
                .populate('scannerId', 'name email')
                .populate('eventId', 'title')
                .sort({ scannedAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            ticket_scanner_model_1.TicketScanLog.countDocuments(query),
        ]);
        return res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get vendor scan logs error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get scan logs.',
        });
    }
});
exports.getVendorScanLogs = getVendorScanLogs;
