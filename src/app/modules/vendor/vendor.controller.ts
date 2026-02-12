import { NextFunction, Response } from 'express';
import { VendorApplication } from './vendor.model';
import { VendorPackage } from './vendorPackage.model';
import { PlatformSettings } from './platformSettings.model';
import { User } from '../auth/auth.model';
import { vendorCreateValidation, vendorDecisionValidation } from './vendor.validation';
import { appError } from '../../errors/appError';
import { userInterface } from '../../middlewares/userInterface';
import { sendEmail, generatePassword, emailTemplates } from '../../services/emailService';
import { sendWhatsAppMessage, whatsappTemplates } from '../../services/whatsappService';

// ============ VENDOR PACKAGES ============
export const createVendorPackage = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { name, description, price, duration, durationType, features, isPopular, sortOrder, isActive, countryPricing } = req.body;
    
    const existing = await VendorPackage.findOne({ name });
    if (existing) return next(new appError('Package with this name already exists', 400));

    
    const doc = await VendorPackage.create({
      name,
      description,
      price,
      duration,
      durationType,
      features: features || [],
      isPopular: isPopular || false,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
      countryPricing: countryPricing || [],
    });

    res.status(201).json({ success: true, statusCode: 201, message: 'Package created successfully', data: doc });
  } catch (error) {
    next(error);
  }
};

export const listVendorPackages = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { activeOnly } = req.query;
    const filter: any = {};
    if (activeOnly === 'true') filter.isActive = true;
    
    const packages = await VendorPackage.find(filter).sort({ sortOrder: 1, price: 1 });
    res.json({ success: true, statusCode: 200, message: 'Packages retrieved', data: packages });
  } catch (error) {
    next(error);
  }
};

export const getVendorPackageById = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const pkg = await VendorPackage.findById(req.params.id);
    if (!pkg) return next(new appError('Package not found', 404));
    res.json({ success: true, statusCode: 200, message: 'Package retrieved', data: pkg });
  } catch (error) {
    next(error);
  }
};

export const updateVendorPackage = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const pkg = await VendorPackage.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pkg) return next(new appError('Package not found', 404));
    res.json({ success: true, statusCode: 200, message: 'Package updated', data: pkg });
  } catch (error) {
    next(error);
  }
};

export const deleteVendorPackage = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const pkg = await VendorPackage.findByIdAndDelete(req.params.id);
    if (!pkg) return next(new appError('Package not found', 404));
    res.json({ success: true, statusCode: 200, message: 'Package deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ PLATFORM SETTINGS ============
export const getPlatformSettings = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    // Ensure defaults exist
    await (PlatformSettings as any).ensureDefaults?.();
    const settings = await PlatformSettings.find({});
    res.json({ success: true, statusCode: 200, message: 'Settings retrieved', data: settings });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformSetting = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { key, value } = req.body;
    const setting = await PlatformSettings.findOneAndUpdate(
      { key },
      { value, updatedBy: req.user?._id },
      { new: true }
    );
    if (!setting) return next(new appError('Setting not found', 404));
    res.json({ success: true, statusCode: 200, message: 'Setting updated', data: setting });
  } catch (error) {
    next(error);
  }
};

// ============ VENDOR APPLICATIONS ============

// Pre-payment validation - check unique fields before payment
export const validateVendorApplication = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { email, phone, gstNumber } = req.body;

    const errors: string[] = [];

    // Check email uniqueness
    if (email) {
      const existingAppByEmail = await VendorApplication.findOne({ 
        email, 
        status: { $in: ['pending', 'approved'] } 
      });
      if (existingAppByEmail) {
        errors.push('An application with this email already exists');
      }

      const existingUserByEmail = await User.findOne({ email, role: 'vendor' });
      if (existingUserByEmail) {
        errors.push('A vendor account with this email already exists');
      }
    }

    // Check phone uniqueness
    if (phone) {
      const existingAppByPhone = await VendorApplication.findOne({ 
        phone, 
        status: { $in: ['pending', 'approved'] } 
      });
      if (existingAppByPhone) {
        errors.push('An application with this phone number already exists');
      }

      const existingUserByPhone = await User.findOne({ phone, role: 'vendor' });
      if (existingUserByPhone) {
        errors.push('A vendor account with this phone number already exists');
      }
    }

    // Check GST number uniqueness (if provided)
    if (gstNumber && gstNumber.trim()) {
      const existingAppByGst = await VendorApplication.findOne({ 
        gstNumber, 
        status: { $in: ['pending', 'approved'] } 
      });
      if (existingAppByGst) {
        errors.push('An application with this GST number already exists');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: errors[0], // Return first error as main message
        errors: errors,
        isValid: false,
      });
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Validation passed',
      isValid: true,
    });
  } catch (error) {
    next(error);
  }
};

export const createVendorApplication = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { vendorName, businessType, gstNumber, panNumber, address, email, phone, selectedServices, paymentInfo } = req.body;

    // Validate base fields
    const validated = vendorCreateValidation.parse({ vendorName, businessType, gstNumber, panNumber, address, email, phone });

    // Check if application already exists with this email
    const existingApp = await VendorApplication.findOne({ email, status: { $in: ['pending', 'approved'] } });
    if (existingApp) {
      return next(new appError('An application with this email already exists', 400));
    }

    // Parse services
    let services = [];
    let totalAmount = 0;
    let requiresPayment = false;

    if (selectedServices) {
      const parsedServices = typeof selectedServices === 'string' ? JSON.parse(selectedServices) : selectedServices;
      
      for (const svc of parsedServices) {
        const serviceData: any = { serviceType: svc.serviceType };
        
        if (svc.serviceType === 'film_trade' && svc.packageId) {
          const pkg = await VendorPackage.findById(svc.packageId);
          if (pkg) {
            serviceData.packageId = pkg._id;
            serviceData.packageName = pkg.name;
            serviceData.packagePrice = pkg.price;
            totalAmount += pkg.price;
            requiresPayment = true;
          }
        } else if (svc.serviceType === 'events') {
          // Check if it's a government event (fixed 10% fee) or regular event (admin-defined fee)
          if (svc.isGovernmentEvent) {
            serviceData.isGovernmentEvent = true;
            serviceData.platformFee = 10; // Fixed 10% for government events
          } else {
            serviceData.isGovernmentEvent = false;
            const setting = await PlatformSettings.findOne({ key: 'event_platform_fee' });
            serviceData.platformFee = setting?.value || 20;
          }
        } else if (svc.serviceType === 'movie_watch') {
          const setting = await PlatformSettings.findOne({ key: 'movie_watch_platform_fee' });
          serviceData.platformFee = setting?.value || 50;
        }
        
        services.push(serviceData);
      }
    }

    // Build file URLs if provided via multer upload.fields
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const aadharFrontUrl = files?.aadharFrontUrl?.[0]?.path || '';
    const aadharBackUrl = files?.aadharBackUrl?.[0]?.path || '';
    const panImageUrl = files?.panImageUrl?.[0]?.path || '';

    // Parse payment info if provided
    let parsedPaymentInfo;
    if (paymentInfo) {
      parsedPaymentInfo = typeof paymentInfo === 'string' ? JSON.parse(paymentInfo) : paymentInfo;
    }

    const doc = await VendorApplication.create({
      userId: req.user?._id,
      ...validated,
      aadharFrontUrl,
      aadharBackUrl,
      panImageUrl,
      selectedServices: services,
      paymentInfo: requiresPayment ? {
        amount: totalAmount,
        status: parsedPaymentInfo?.status || 'pending',
        transactionId: parsedPaymentInfo?.transactionId,
        paymentMethod: parsedPaymentInfo?.paymentMethod,
        paidAt: parsedPaymentInfo?.status === 'completed' ? new Date() : undefined,
      } : undefined,
      requiresPayment,
      totalAmount,
      status: 'pending',
    });

    // Send confirmation email
    try {
      const template = emailTemplates.vendorApplicationReceived(vendorName);
      await sendEmail({ to: email, ...template });
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
    }

    // Send WhatsApp confirmation message
    try {
      const whatsappMessage = whatsappTemplates.vendorApplicationReceived(vendorName);
      await sendWhatsAppMessage({ phone, message: whatsappMessage });
    } catch (whatsappErr) {
      console.error('Failed to send WhatsApp confirmation:', whatsappErr);
    }

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Vendor application submitted successfully',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const listVendorApplications = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { status, userId } = req.query as { status?: string; userId?: string };
    const filter: any = { isDeleted: false };
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const items = await VendorApplication.find(filter)
      .populate('selectedServices.packageId')
      .sort({ createdAt: -1 });
      
    res.json({
      success: true,
      statusCode: 200,
      message: items.length ? 'Vendor applications retrieved successfully' : 'No vendor applications found',
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorApplicationById = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await VendorApplication.findOne({ _id: id, isDeleted: false })
      .populate('selectedServices.packageId');
    if (!item) return next(new appError('Vendor application not found', 404));

    // If non-admin, only allow owner to view
    if (req.user?.role !== 'admin' && String(item.userId) !== String(req.user?._id)) {
      return next(new appError('You do not have permission to view this application', 403));
    }

    res.json({ success: true, statusCode: 200, message: 'Vendor application retrieved successfully', data: item });
  } catch (error) {
    next(error);
  }
};

export const decideVendorApplication = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { decision, rejectionReason } = vendorDecisionValidation.parse(req.body);

    const item = await VendorApplication.findOne({ _id: id, isDeleted: false });
    if (!item) return next(new appError('Vendor application not found', 404));
    if (item.status !== 'pending') return next(new appError('Application already processed', 400));

    // Check payment for film_trade if required
    if (decision === 'approve' && item.requiresPayment) {
      if (!item.paymentInfo || item.paymentInfo.status !== 'completed') {
        return next(new appError('Payment not completed for this application', 400));
      }
    }

    if (decision === 'approve') {
      // Generate password and create vendor user
      const password = generatePassword();
      
      // Check if user already exists by email or phone
      let vendorUser = await User.findOne({ 
        $or: [
          { email: item.email },
          { phone: item.phone }
        ]
      });
      
      if (vendorUser) {
        // Update existing user to vendor
        vendorUser.role = 'vendor';
        vendorUser.password = password;
        // Update email/phone if different
        if (vendorUser.email !== item.email) vendorUser.email = item.email;
        if (vendorUser.phone !== item.phone) vendorUser.phone = item.phone;
        vendorUser.name = item.vendorName;
        // Add vendor services to user
        const serviceTypes = item.selectedServices.map(s => s.serviceType);
        (vendorUser as any).vendorServices = serviceTypes;
        await vendorUser.save();
      } else {
        // Create new vendor user
        const serviceTypes = item.selectedServices.map(s => s.serviceType);
        vendorUser = await User.create({
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
      item.approvedBy = req.user?._id;
      item.vendorUserId = vendorUser._id as any;
      await item.save();

      // Send approval email with credentials
      const serviceNames = item.selectedServices.map(s => {
        if (s.serviceType === 'film_trade') return `Film Trade (${s.packageName})`;
        if (s.serviceType === 'events') return `Events (${s.platformFee}% platform fee)`;
        if (s.serviceType === 'movie_watch') return `Movie Watch (${s.platformFee}% platform fee)`;
        return s.serviceType;
      });

      const panelUrl = 'https://panel.moviemart.org';
      
      console.log("vendor password is ", password)

      try {
        const template = emailTemplates.vendorApproved(item.vendorName, item.email, password, serviceNames, panelUrl);
        await sendEmail({ to: item.email, ...template });
      } catch (emailErr) {
        console.error('Failed to send approval email:', emailErr);
      }

      // Send WhatsApp approval message with credentials
      try {
        const whatsappMessage = whatsappTemplates.vendorApproved(item.vendorName, item.email, password, serviceNames, panelUrl);
        await sendWhatsAppMessage({ phone: item.phone, message: whatsappMessage });
      } catch (whatsappErr) {
        console.error('Failed to send WhatsApp approval message:', whatsappErr);
      }

      res.json({ 
        success: true, 
        statusCode: 200, 
        message: 'Application approved. Credentials sent to vendor email.', 
        data: item 
      });
    } else {
      item.status = 'rejected';
      item.rejectionReason = rejectionReason || 'Not specified';
      await item.save();

      // Send rejection email
      try {
        const template = emailTemplates.vendorRejected(item.vendorName, item.rejectionReason);
        await sendEmail({ to: item.email, ...template });
      } catch (emailErr) {
        console.error('Failed to send rejection email:', emailErr);
      }

      // Send WhatsApp rejection message
      try {
        const whatsappMessage = whatsappTemplates.vendorRejected(item.vendorName, item.rejectionReason);
        await sendWhatsAppMessage({ phone: item.phone, message: whatsappMessage });
      } catch (whatsappErr) {
        console.error('Failed to send WhatsApp rejection message:', whatsappErr);
      }

      res.json({ success: true, statusCode: 200, message: 'Application rejected', data: item });
    }
  } catch (error) {
    next(error);
  }
};

export const deleteVendorApplication = async (req: userInterface, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await VendorApplication.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!item) return next(new appError('Vendor application not found', 404));
    res.json({ success: true, statusCode: 200, message: 'Application deleted' });
  } catch (error) {
    next(error);
  }
};
