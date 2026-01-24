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
exports.emailTemplates = exports.generatePassword = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create transporter with flexible SMTP configuration
const createTransporter = () => {
    var _a;
    // Check if using Gmail or GoDaddy
    const isGmail = ((_a = process.env.SMTP_HOST) === null || _a === void 0 ? void 0 : _a.includes('gmail')) || !process.env.SMTP_HOST;
    const config = isGmail ? {
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    } : {
        host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false,
        },
    };
    console.log('SMTP Configuration:', {
        type: isGmail ? 'Gmail' : 'GoDaddy',
        host: config.host || 'gmail',
        port: config.port || 'default',
        user: config.auth.user,
        passwordSet: !!config.auth.pass,
    });
    return nodemailer_1.default.createTransport(config);
};
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"MovieMart" <info@moviemart.org>`, // Always show MovieMart email
            replyTo: process.env.SMTP_EMAIL, // Replies go to configured email
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || '',
        };
        yield transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.to}`);
        return true;
    }
    catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
});
exports.sendEmail = sendEmail;
// Generate random 8-digit password
const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};
exports.generatePassword = generatePassword;
// Email Templates
exports.emailTemplates = {
    vendorApplicationReceived: (vendorName) => ({
        subject: 'Vendor Application Received - MovieMart',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .highlight { color: #667eea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 MovieMart</h1>
            <p>Application Received</p>
          </div>
          <div class="content">
            <h2>Hello ${vendorName},</h2>
            <p>Thank you for submitting your vendor application to <span class="highlight">MovieMart</span>!</p>
            <p>We have received your application and our team is currently reviewing it. This process typically takes 1-3 business days.</p>
            <p>You will receive an email notification once your application has been reviewed.</p>
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Our team will verify your documents</li>
              <li>We'll review your business information</li>
              <li>You'll receive approval or feedback via email</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br><strong>The MovieMart Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MovieMart. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),
    vendorApproved: (vendorName, email, password, services, panelUrl) => ({
        subject: '🎉 Congratulations! Your Vendor Application is Approved - MovieMart',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: #fff; border: 2px solid #11998e; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .credentials h3 { color: #11998e; margin-top: 0; }
          .cred-item { margin: 10px 0; padding: 10px; background: #f0f9f7; border-radius: 5px; }
          .cred-label { color: #666; font-size: 12px; }
          .cred-value { font-size: 16px; font-weight: bold; color: #333; word-break: break-all; }
          .btn { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .services { background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 MovieMart</h1>
            <p>Application Approved!</p>
          </div>
          <div class="content">
            <h2>Congratulations ${vendorName}! 🎉</h2>
            <p>Great news! Your vendor application has been <strong style="color: #11998e;">APPROVED</strong>.</p>
            
            <div class="services">
              <strong>Your Activated Services:</strong>
              <ul>
                ${services.map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>

            <div class="credentials">
              <h3>🔐 Your Login Credentials</h3>
              <div class="cred-item">
                <div class="cred-label">Email</div>
                <div class="cred-value">${email}</div>
              </div>
              <div class="cred-item">
                <div class="cred-label">Password</div>
                <div class="cred-value">${password}</div>
              </div>
              <div class="cred-item">
                <div class="cred-label">Vendor Panel URL</div>
                <div class="cred-value">${panelUrl}</div>
              </div>
            </div>

            <p><strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.</p>
            
            <center>
              <a href="${panelUrl}" class="btn">Login to Vendor Panel</a>
            </center>

            <p style="margin-top: 30px;">If you have any questions, our support team is here to help!</p>
            <p>Best regards,<br><strong>The MovieMart Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MovieMart. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),
    vendorRejected: (vendorName, reason) => ({
        subject: 'Vendor Application Update - MovieMart',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reason-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 MovieMart</h1>
            <p>Application Update</p>
          </div>
          <div class="content">
            <h2>Hello ${vendorName},</h2>
            <p>Thank you for your interest in becoming a vendor on MovieMart.</p>
            <p>After careful review, we regret to inform you that your application could not be approved at this time.</p>
            
            <div class="reason-box">
              <strong>Reason:</strong>
              <p>${reason}</p>
            </div>

            <p>You are welcome to submit a new application after addressing the above concerns.</p>
            <p>If you believe this decision was made in error or have questions, please contact our support team.</p>
            <p>Best regards,<br><strong>The MovieMart Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MovieMart. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),
};
