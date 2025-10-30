import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validations/validation.js";
import {
    requestResetPasswordValidation,
    verifyOTPValidation,
    resetPasswordValidation,
} from "../validations/password-reset-validation.js";
import emailService from "./email.service.js";
import { generateOTP, getOTPExpiry, isOTPExpired } from "../utils/otp-generator.js";
import bcrypt from "bcrypt";
import { logger } from "../application/logging.js";

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS) || 3;

/**
 * Request password reset - Generate and send OTP
 * @param {Object} request - { email }
 * @returns {Promise<Object>}
 */
const requestResetPassword = async(request) => {
    const validated = validate(requestResetPasswordValidation, request);
    const { email } = validated;

    // Check if user exists
    const user = await prismaClient.user.findFirst({
        where: {
            email: email.toLowerCase(),
        },
        select: {
            id: true,
            email: true,
            username: true,
            isActive: true,
        },
    });

    // For security: Don't reveal if email exists or not
    // Always return success message
    if (!user) {
        logger.warn(`Password reset requested for non-existent email: ${email}`);
        return {
            message: "If the email exists, an OTP has been sent",
            expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
        };
    }

    // Check if account is active
    if (!user.isActive) {
        logger.warn(`Password reset requested for inactive account: ${email}`);
        return {
            message: "If the email exists, an OTP has been sent",
            expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
        };
    }

    // Check rate limiting: max 3 OTP requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await prismaClient.passwordResetOtp.count({
        where: {
            email: email.toLowerCase(),
            createdAt: {
                gte: oneHourAgo,
            },
        },
    });

    if (recentOTPs >= 3) {
        throw new ResponseError(
            429,
            "Too many OTP requests. Please try again later."
        );
    }

    // Invalidate all previous OTPs for this user
    await prismaClient.passwordResetOtp.updateMany({
        where: {
            userId: user.id,
            isUsed: false,
        },
        data: {
            isUsed: true,
        },
    });

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = getOTPExpiry(OTP_EXPIRY_MINUTES);

    // Save OTP to database
    await prismaClient.passwordResetOtp.create({
        data: {
            userId: user.id,
            email: email.toLowerCase(),
            otpCode: otpCode,
            expiresAt: expiresAt,
            isUsed: false,
            attempts: 0,
        },
    });

    // Send OTP via email
    try {
        await emailService.sendOTPEmail(user.email, otpCode, OTP_EXPIRY_MINUTES);

        logger.info(`OTP generated and sent for user: ${user.username}`);
    } catch (error) {
        logger.error(`Failed to send OTP email to ${user.email}:`, error);
        throw new ResponseError(500, "Failed to send OTP email. Please try again.");
    }

    return {
        message: "If the email exists, an OTP has been sent",
        expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
    };
};

/**
 * Verify OTP code
 * @param {Object} request - { email, otp }
 * @returns {Promise<Object>}
 */
const verifyOTP = async(request) => {
    const validated = validate(verifyOTPValidation, request);
    const { email, otp } = validated;

    // Find the most recent unused OTP for this email
    const otpRecord = await prismaClient.passwordResetOtp.findFirst({
        where: {
            email: email.toLowerCase(),
            otpCode: otp,
            isUsed: false,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    isActive: true,
                },
            },
        },
    });

    if (!otpRecord) {
        logger.warn(`Invalid OTP attempt for email: ${email}`);
        throw new ResponseError(400, "Invalid or expired OTP code");
    }

    // Check if user account is active
    if (!otpRecord.user.isActive) {
        throw new ResponseError(403, "Account is not active");
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.expiresAt)) {
        logger.warn(`Expired OTP used for email: ${email}`);
        throw new ResponseError(400, "OTP code has expired. Please request a new one.");
    }

    // Check attempts limit
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        logger.warn(`Max OTP attempts exceeded for email: ${email}`);
        throw new ResponseError(
            429,
            "Maximum verification attempts exceeded. Please request a new OTP."
        );
    }

    // Increment attempt counter
    await prismaClient.passwordResetOtp.update({
        where: {
            id: otpRecord.id,
        },
        data: {
            attempts: otpRecord.attempts + 1,
        },
    });

    logger.info(`OTP verified successfully for user: ${otpRecord.user.username}`);

    return {
        message: "OTP verified successfully",
        verified: true,
    };
};

/**
 * Reset password with verified OTP
 * @param {Object} request - { email, otp, newPassword }
 * @returns {Promise<Object>}
 */
const resetPassword = async(request) => {
    const validated = validate(resetPasswordValidation, request);
    const { email, otp, newPassword } = validated;

    // Find and verify OTP one final time
    const otpRecord = await prismaClient.passwordResetOtp.findFirst({
        where: {
            email: email.toLowerCase(),
            otpCode: otp,
            isUsed: false,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    isActive: true,
                },
            },
        },
    });

    if (!otpRecord) {
        throw new ResponseError(400, "Invalid or expired OTP code");
    }

    // Check if user account is active
    if (!otpRecord.user.isActive) {
        throw new ResponseError(403, "Account is not active");
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.expiresAt)) {
        throw new ResponseError(400, "OTP code has expired. Please request a new one.");
    }

    // Check attempts limit
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        throw new ResponseError(
            429,
            "Maximum verification attempts exceeded. Please request a new OTP."
        );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Use transaction to update password, mark OTP as used, and invalidate refresh tokens
    await prismaClient.$transaction(async(tx) => {
        // Update password
        await tx.user.update({
            where: {
                id: otpRecord.userId,
            },
            data: {
                password: hashedPassword,
                updatedAt: new Date(),
            },
        });

        // Mark OTP as used
        await tx.passwordResetOtp.update({
            where: {
                id: otpRecord.id,
            },
            data: {
                isUsed: true,
            },
        });

        // Invalidate all refresh tokens for security
        await tx.refreshToken.updateMany({
            where: {
                userId: otpRecord.userId,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
            },
        });
    });

    logger.info(`Password reset successfully for user: ${otpRecord.user.username}`);

    return {
        message: "Password reset successfully. Please login with your new password.",
    };
};

/**
 * Clean up expired OTPs (can be run as a cron job)
 * @returns {Promise<number>} Number of deleted records
 */
const cleanupExpiredOTPs = async() => {
    const result = await prismaClient.passwordResetOtp.deleteMany({
        where: {
            OR: [{
                    expiresAt: {
                        lt: new Date(),
                    },
                },
                {
                    isUsed: true,
                    createdAt: {
                        lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours old
                    },
                },
            ],
        },
    });

    logger.info(`Cleaned up ${result.count} expired OTP records`);
    return result.count;
};

export default {
    requestResetPassword,
    verifyOTP,
    resetPassword,
    cleanupExpiredOTPs,
};