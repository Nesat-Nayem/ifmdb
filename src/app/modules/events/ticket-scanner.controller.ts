import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { TicketScannerAccess, TicketScanLog, ITicketScannerAccess } from './ticket-scanner.model';
import { EventBooking, EventETicket } from './event-booking.model';
import Event from './events.model';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SCANNER_TOKEN_EXPIRY = '24h';

// ============ SCANNER ACCESS CRUD (Vendor Management) ============

/**
 * Create a new scanner access account
 * Only vendors can create scanner access for their events
 */
export const createScannerAccess = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).user?._id;
    const { name, email, password, phone, allowedEvents, notes } = req.body;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Vendor authentication required.',
      });
    }

    // Check if email already exists
    const existingScanner = await TicketScannerAccess.findOne({ email: email.toLowerCase() });
    if (existingScanner) {
      return res.status(400).json({
        success: false,
        message: 'A scanner account with this email already exists.',
      });
    }

    // Validate allowed events belong to this vendor
    if (allowedEvents && allowedEvents.length > 0) {
      const events = await Event.find({
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

    const scannerAccess = new TicketScannerAccess({
      vendorId,
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      allowedEvents: allowedEvents || [],
      notes: notes || '',
      isActive: true,
    });

    await scannerAccess.save();

    // Remove password from response
    const response = scannerAccess.toObject() as any;
    delete response.password;

    return res.status(201).json({
      success: true,
      message: 'Scanner access created successfully.',
      data: response,
    });
  } catch (error: any) {
    console.error('Create scanner access error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create scanner access.',
    });
  }
};

/**
 * Get all scanner access accounts for a vendor
 */
export const getVendorScannerAccounts = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).user?._id;
    const { page = 1, limit = 10, isActive, search } = req.query;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    const query: any = { vendorId };
    
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
    
    const [scanners, total] = await Promise.all([
      TicketScannerAccess.find(query)
        .select('-password -scannerToken')
        .populate('allowedEvents', 'title startDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TicketScannerAccess.countDocuments(query),
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
  } catch (error: any) {
    console.error('Get scanner accounts error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get scanner accounts.',
    });
  }
};

/**
 * Get single scanner access by ID
 */
export const getScannerAccessById = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).user?._id;
    const { id } = req.params;

    const scanner = await TicketScannerAccess.findOne({
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
  } catch (error: any) {
    console.error('Get scanner access error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get scanner access.',
    });
  }
};

/**
 * Update scanner access
 */
export const updateScannerAccess = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).user?._id;
    const { id } = req.params;
    const { name, phone, allowedEvents, notes, isActive, password } = req.body;

    const scanner = await TicketScannerAccess.findOne({ _id: id, vendorId });
    
    if (!scanner) {
      return res.status(404).json({
        success: false,
        message: 'Scanner access not found.',
      });
    }

    // Validate allowed events if provided
    if (allowedEvents && allowedEvents.length > 0) {
      const events = await Event.find({
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
    if (name !== undefined) scanner.name = name;
    if (phone !== undefined) scanner.phone = phone;
    if (allowedEvents !== undefined) scanner.allowedEvents = allowedEvents;
    if (notes !== undefined) scanner.notes = notes;
    if (isActive !== undefined) scanner.isActive = isActive;
    if (password) scanner.password = password; // Will be hashed by pre-save hook

    await scanner.save();

    const response = scanner.toObject() as any;
    delete response.password;
    delete response.scannerToken;

    return res.status(200).json({
      success: true,
      message: 'Scanner access updated successfully.',
      data: response,
    });
  } catch (error: any) {
    console.error('Update scanner access error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update scanner access.',
    });
  }
};

/**
 * Delete scanner access
 */
export const deleteScannerAccess = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).user?._id;
    const { id } = req.params;

    const scanner = await TicketScannerAccess.findOneAndDelete({ _id: id, vendorId });
    
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
  } catch (error: any) {
    console.error('Delete scanner access error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete scanner access.',
    });
  }
};

/**
 * Toggle scanner access status (activate/deactivate)
 */
export const toggleScannerStatus = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).user?._id;
    const { id } = req.params;

    const scanner = await TicketScannerAccess.findOne({ _id: id, vendorId });
    
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
    
    await scanner.save();

    return res.status(200).json({
      success: true,
      message: `Scanner access ${scanner.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { isActive: scanner.isActive },
    });
  } catch (error: any) {
    console.error('Toggle scanner status error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle scanner status.',
    });
  }
};

// ============ SCANNER LOGIN & AUTHENTICATION ============

/**
 * Scanner login - For Flutter app scanner login
 */
export const scannerLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, deviceInfo } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const scanner = await TicketScannerAccess.findOne({ 
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

    const isMatch = await scanner.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Generate scanner token
    const token = jwt.sign(
      { 
        scannerId: scanner._id,
        vendorId: scanner.vendorId,
        type: 'scanner',
      },
      JWT_SECRET,
      { expiresIn: SCANNER_TOKEN_EXPIRY }
    );

    // Update scanner record
    scanner.scannerToken = token;
    scanner.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    scanner.lastLoginAt = new Date();
    scanner.deviceInfo = deviceInfo || '';
    await scanner.save();

    // Get allowed events with details
    let allowedEventsData: any[] = [];
    if (scanner.allowedEvents.length > 0) {
      allowedEventsData = await Event.find({
        _id: { $in: scanner.allowedEvents },
      }).select('title startDate endDate location posterImage');
    } else {
      // If no specific events, get all vendor's active events
      allowedEventsData = await Event.find({
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
  } catch (error: any) {
    console.error('Scanner login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Login failed.',
    });
  }
};

/**
 * Scanner logout
 */
export const scannerLogout = async (req: Request, res: Response) => {
  try {
    const scannerId = (req as any).scanner?._id;
    
    if (scannerId) {
      await TicketScannerAccess.findByIdAndUpdate(scannerId, {
        scannerToken: '',
        tokenExpiresAt: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error: any) {
    console.error('Scanner logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed.',
    });
  }
};

// ============ TICKET VALIDATION ============

/**
 * Validate a ticket by scanning barcode/QR code
 * The barcode contains the bookingReference (e.g., EBKMJMS5WSZY069LI)
 */
export const validateTicket = async (req: Request, res: Response) => {
  try {
    const scanner = (req as any).scanner as ITicketScannerAccess;
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
    const ticket = await EventETicket.findOne({
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
    const createScanLog = async (
      result: string,
      message: string,
      ticketDetails?: any,
      eventId?: mongoose.Types.ObjectId
    ) => {
      const scanLog = new TicketScanLog({
        scannerId: scanner._id,
        ticketId: ticket?._id,
        bookingReference,
        eventId,
        scanResult: result,
        scanMessage: message,
        ticketDetails,
        location: location || {},
        deviceInfo: deviceInfo || '',
      });
      await scanLog.save();

      // Update scanner stats
      scanner.lastScanAt = new Date();
      scanner.totalScans += 1;
      await scanner.save();
    };

    // Ticket not found
    if (!ticket) {
      await createScanLog('not_found', 'Ticket not found in the system.');
      
      return res.status(404).json({
        success: false,
        scanResult: 'not_found',
        message: 'Ticket not found. Please check the booking reference.',
      });
    }

    const booking = ticket.bookingId as any;
    const event = booking?.eventId;
    const customer = booking?.userId;

    // Check if this scanner is allowed to scan this event's tickets
    const eventCreatorId = event?.createdBy?.toString();
    const scannerVendorId = scanner.vendorId.toString();

    // Verify the event belongs to scanner's vendor
    if (eventCreatorId !== scannerVendorId) {
      await createScanLog(
        'wrong_event',
        'This ticket belongs to a different vendor.',
        {
          eventName: event?.title,
        },
        event?._id
      );

      return res.status(403).json({
        success: false,
        scanResult: 'wrong_event',
        message: 'You are not authorized to scan tickets for this event.',
      });
    }

    // If scanner has specific allowed events, check if this event is in the list
    if (scanner.allowedEvents.length > 0) {
      const isAllowed = scanner.allowedEvents.some(
        (allowedId) => allowedId.toString() === event?._id?.toString()
      );
      
      if (!isAllowed) {
        await createScanLog(
          'wrong_event',
          'Scanner not authorized for this specific event.',
          {
            eventName: event?.title,
          },
          event?._id
        );

        return res.status(403).json({
          success: false,
          scanResult: 'wrong_event',
          message: 'You are not authorized to scan tickets for this specific event.',
        });
      }
    }

    // Check booking status
    if (booking?.bookingStatus !== 'confirmed') {
      await createScanLog(
        'invalid',
        `Booking status is ${booking?.bookingStatus}`,
        {
          customerName: customer?.name,
          eventName: event?.title,
        },
        event?._id
      );

      return res.status(400).json({
        success: false,
        scanResult: 'invalid',
        message: `This booking is ${booking?.bookingStatus}. Entry not allowed.`,
      });
    }

    // Check if ticket is already used
    if (ticket.isUsed) {
      await createScanLog(
        'already_used',
        `Ticket was already used at ${ticket.usedAt}`,
        {
          customerName: customer?.name,
          eventName: event?.title,
          eventDate: event?.startDate,
        },
        event?._id
      );

      return res.status(400).json({
        success: false,
        scanResult: 'already_used',
        message: 'This ticket has already been used.',
        usedAt: ticket.usedAt,
        ticketDetails: {
          customerName: customer?.name,
          eventName: event?.title,
          quantity: ticket.quantity,
        },
      });
    }

    // Check event date (optional - allow entry on event day)
    const eventStartDate = new Date(event?.startDate);
    const eventEndDate = event?.endDate ? new Date(event.endDate) : eventStartDate;
    const now = new Date();
    
    // Allow entry from event start date minus 2 hours to event end date plus 4 hours
    const entryStartTime = new Date(eventStartDate.getTime() - 2 * 60 * 60 * 1000);
    const entryEndTime = new Date(eventEndDate.getTime() + 4 * 60 * 60 * 1000);

    if (now < entryStartTime || now > entryEndTime) {
      // Just warn but still allow (vendor decision)
      console.log(`Ticket scanned outside event time window for event: ${event?.title}`);
    }

    // ✅ VALID TICKET - Mark as used
    ticket.isUsed = true;
    ticket.usedAt = new Date();
    ticket.scannedBy = scanner._id as mongoose.Types.ObjectId;
    ticket.scanLocation = location?.address || '';
    await ticket.save();

    const ticketDetails = {
      customerName: customer?.name,
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      ticketType: booking?.seatType,
      quantity: ticket.quantity,
      eventName: event?.title,
      eventDate: event?.startDate,
      eventLocation: event?.location,
    };

    await createScanLog('valid', 'Ticket validated successfully.', ticketDetails, event?._id);

    return res.status(200).json({
      success: true,
      scanResult: 'valid',
      message: 'Ticket validated successfully! Entry allowed.',
      data: {
        ticketNumber: ticket.ticketNumber,
        bookingReference: booking?.bookingReference,
        customer: {
          name: customer?.name,
          email: customer?.email,
          phone: customer?.phone,
        },
        event: {
          title: event?.title,
          date: event?.startDate,
          location: event?.location,
          posterImage: event?.posterImage,
        },
        ticket: {
          type: booking?.seatType,
          quantity: ticket.quantity,
          amount: booking?.finalAmount,
        },
        validatedAt: ticket.usedAt,
      },
    });
  } catch (error: any) {
    console.error('Validate ticket error:', error);
    return res.status(500).json({
      success: false,
      scanResult: 'error',
      message: error.message || 'Failed to validate ticket.',
    });
  }
};

/**
 * Get scan history for a scanner
 */
export const getScanHistory = async (req: Request, res: Response) => {
  try {
    const scanner = (req as any).scanner as ITicketScannerAccess;
    const { page = 1, limit = 20, eventId, scanResult } = req.query;

    if (!scanner) {
      return res.status(401).json({
        success: false,
        message: 'Scanner authentication required.',
      });
    }

    const query: any = { scannerId: scanner._id };
    
    if (eventId) {
      query.eventId = eventId;
    }
    
    if (scanResult) {
      query.scanResult = scanResult;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      TicketScanLog.find(query)
        .populate('eventId', 'title')
        .sort({ scannedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TicketScanLog.countDocuments(query),
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
  } catch (error: any) {
    console.error('Get scan history error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get scan history.',
    });
  }
};

/**
 * Get scan statistics for a scanner
 */
export const getScanStats = async (req: Request, res: Response) => {
  try {
    const scanner = (req as any).scanner as ITicketScannerAccess;
    const { eventId } = req.query;

    if (!scanner) {
      return res.status(401).json({
        success: false,
        message: 'Scanner authentication required.',
      });
    }

    const matchQuery: any = { scannerId: scanner._id };
    if (eventId) {
      matchQuery.eventId = new mongoose.Types.ObjectId(eventId as string);
    }

    const stats = await TicketScanLog.aggregate([
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

    const todayStats = await TicketScanLog.aggregate([
      {
        $match: {
          ...matchQuery,
          scannedAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: '$scanResult',
          count: { $sum: 1 },
        },
      },
    ]);

    const formatStats = (statsArray: any[]) => {
      const result: any = {
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
  } catch (error: any) {
    console.error('Get scan stats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get scan statistics.',
    });
  }
};

/**
 * Get vendor's scan logs (for admin panel)
 */
export const getVendorScanLogs = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).user?._id;
    const { page = 1, limit = 20, scannerId, eventId, scanResult } = req.query;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    // Get all scanner IDs for this vendor
    const scannerIds = await TicketScannerAccess.find({ vendorId }).distinct('_id');

    const query: any = { scannerId: { $in: scannerIds } };
    
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

    const [logs, total] = await Promise.all([
      TicketScanLog.find(query)
        .populate('scannerId', 'name email')
        .populate('eventId', 'title')
        .sort({ scannedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TicketScanLog.countDocuments(query),
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
  } catch (error: any) {
    console.error('Get vendor scan logs error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get scan logs.',
    });
  }
};
