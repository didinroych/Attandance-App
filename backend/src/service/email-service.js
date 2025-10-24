import nodemailer from "nodemailer";
import { logger } from "../application/logging.js";

/**
 * Create SMTP transporter
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465', // true for 465
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Generate OTP email HTML template
 * @param {string} otpCode - 6-digit OTP code
 * @param {number} expiryMinutes - Minutes until expiration
 * @returns {string} HTML email template
 */
const getOTPEmailTemplate = (otpCode, expiryMinutes = 10) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #4F46E5; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Password Reset Request</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                Hello,
                            </p>
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                We received a request to reset your password. Use the following OTP code to proceed:
                            </p>
                            
                            <!-- OTP Code Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center" style="padding: 20px; background-color: #F3F4F6; border-radius: 8px;">
                                        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; font-family: 'Courier New', monospace;">
                                            ${otpCode}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                This code will expire in <strong>${expiryMinutes} minutes</strong>.
                            </p>
                            
                            <!-- Warning Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 15px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
                                        <p style="margin: 0; font-size: 14px; color: #92400E;">
                                            ⚠️ <strong>Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP code.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 24px; color: #333333;">
                                If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #F9FAFB; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                                This is an automated message, please do not reply.
                            </p>
                            <p style="margin: 0; font-size: 14px; color: #6B7280;">
                                © ${new Date().getFullYear()} School Attendance App. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

/**
 * Send OTP email
 * @param {string} email - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {number} expiryMinutes - Minutes until expiration
 * @returns {Promise<void>}
 */
const sendOTPEmail = async(email, otpCode, expiryMinutes = 10) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"School Attendance App" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: email,
            subject: "Password Reset OTP Code",
            html: getOTPEmailTemplate(otpCode, expiryMinutes),
            text: `Your password reset OTP code is: ${otpCode}. This code will expire in ${expiryMinutes} minutes. Never share this code with anyone.`,
        };

        const info = await transporter.sendMail(mailOptions);

        logger.info(`OTP email sent successfully to ${email}`, {
            messageId: info.messageId,
        });

        return info;
    } catch (error) {
        logger.error("Failed to send OTP email", {
            error: error.message,
            email: email,
        });
        throw new Error("Failed to send OTP email");
    }
};

/**
 * Verify SMTP configuration
 * @returns {Promise<boolean>}
 */
const verifyEmailConfig = async() => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        logger.info("SMTP configuration verified successfully");
        return true;
    } catch (error) {
        logger.error("SMTP configuration verification failed", {
            error: error.message,
        });
        return false;
    }
};

export default {
    sendOTPEmail,
    verifyEmailConfig,
};